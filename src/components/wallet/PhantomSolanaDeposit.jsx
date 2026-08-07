import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance, addWagerRequirement } from '@/lib/useCasinoBalance';
import { useToast } from '@/components/ui/use-toast';
import { Wallet, Loader2, CheckCircle2, AlertTriangle, ArrowRight, ExternalLink, LogOut } from 'lucide-react';
import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferCheckedInstruction, createAssociatedTokenAccountIdempotentInstruction } from '@solana/spl-token';
import { getCryptoPrices } from '@/lib/cryptoPrices';
import {
  buildPhantomUrl, newDappKeyPair, deriveSharedSecret, encryptPayload, decryptPayload,
  b58Encode, b58Decode, loadPhantomSession, savePhantomSession, clearPhantomSession,
} from '@/lib/phantomDeepLink';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";
const PHANTOM_PURPLE = '#AB9FF2';
const PHANTOM_LOGO = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/1a373c31c_file_00000000bf088207bca808f6fa5670a3.png';
const ADMIN_SOL = 'ftmbTXAc6XWyT6ieXHLiEZ7zuJFDPVSAdvrvrTveniW';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const USDC_DECIMALS = 6;

function buildRedirectLink(amount) {
  return `${window.location.origin}/pay?amount=${amount}&method=phantom-sol`;
}

function cleanPhantomUrl() {
  const sp = new URLSearchParams(window.location.search);
  ['phantom_encryption_public_key', 'nonce', 'data', 'errorCode', 'errorMessage', 'method'].forEach((k) => sp.delete(k));
  const qs = sp.toString();
  window.history.replaceState({}, '', window.location.pathname + (qs ? '?' + qs : ''));
}

// Solana RPC calls go through the backend proxy — the public Solana endpoint
// returns 403 to browser/CORS requests, so we forward server-side instead.
async function solanaRpc(method, params = []) {
  const res = await base44.functions.invoke('solanaRpcProxy', { method, params });
  if (!res?.data?.ok) throw new Error(res?.data?.reason || 'RPC proxy failed');
  return res.data.result;
}

function bytesToBase64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

// Phantom's injected provider — available inside Phantom's in-app browser and
// the desktop browser extension. Unlike universal deep-links, the injected
// provider connects/signs directly with NO "malicious dApp" security block.
function getInjectedPhantom() {
  if (typeof window === 'undefined') return null;
  const p = window?.phantom?.solana;
  if (p && typeof p.connect === 'function' && typeof p.signTransaction === 'function') return p;
  return null;
}

export default function PhantomSolanaDeposit({ amount, onDone }) {
  const { setBalance } = useCasinoBalance();
  const { toast } = useToast();
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState('idle'); // idle|connected|sending|confirming|verifying|done|error
  const [errMsg, setErrMsg] = useState('');
  const [price, setPrice] = useState(0);
  const [payAsset, setPayAsset] = useState('usdc'); // 'sol' | 'usdc'
  const [connectionMethod, setConnectionMethod] = useState('deeplink'); // 'injected' | 'deeplink'
  const [hasInjected, setHasInjected] = useState(false);

  const solAmt = price ? amount / price : 0;
  const lamports = Math.round(solAmt * LAMPORTS_PER_SOL);
  const usdcUnits = Math.round(amount * Math.pow(10, USDC_DECIMALS));
  const netLocked = ['sending', 'confirming', 'verifying'].includes(status) || status === 'connected';

  const finishVerify = async (fn, payload, amt) => {
    setStatus('verifying');
    const res = await base44.functions.invoke(fn, payload);
    if (res?.data?.ok) {
      if (!res.data.already) {
        const credited = Number(res.data.amount || amt);
        setBalance((b) => b + credited);
        addWagerRequirement(credited);
      }
      setStatus('done');
      toast({ title: 'Deposit successful', description: `$${Number(res.data.amount || amt).toFixed(2)} has been added to your balance.` });
      setTimeout(() => onDone?.(), 1200);
    } else {
      const reason = res?.data?.reason || 'unknown';
      setErrMsg(reason === 'pending' ? 'Transaction is still pending — please try again shortly.' : `Verification failed: ${reason}`);
      setStatus('error');
    }
  };

  // Handle the connect deep-link return: Phantom redirects back here with
  // ?phantom_encryption_public_key=...&nonce=...&data=...  (data is an encrypted
  // { public_key, session } JSON). Derive the shared secret, decrypt, persist.
  const handleConnectReturn = (phantomEncPub, nonceB58, dataB58) => {
    try {
      const saved = loadPhantomSession();
      if (!saved?.dappKeyPair) { setErrMsg('Session key lost — please reconnect.'); setStatus('error'); cleanPhantomUrl(); return; }
      const dappSecretKey = b58Decode(saved.dappKeyPair.secretKey);
      const sharedSecret = deriveSharedSecret(phantomEncPub, dappSecretKey);
      const data = decryptPayload(dataB58, nonceB58, sharedSecret);
      savePhantomSession({ ...saved, publicKey: data.public_key, session: data.session, sharedSecret: b58Encode(sharedSecret) });
      setAccount(data.public_key);
      setStatus('connected');
      cleanPhantomUrl();
    } catch (e) {
      setErrMsg('Connect failed: ' + (e.message || e));
      setStatus('error');
      cleanPhantomUrl();
    }
  };

  // Handle the signTransaction deep-link return: Phantom redirects back with
  // ?nonce=...&data=...  (data is an encrypted { transaction } JSON holding the
  // SIGNED serialized tx). Decrypt, broadcast it ourselves, then verify.
  const handleSignReturn = async (nonceB58, dataB58) => {
    try {
      const saved = loadPhantomSession();
      if (!saved?.sharedSecret || !saved?.pending) { setErrMsg('Session lost — please reconnect.'); setStatus('error'); cleanPhantomUrl(); return; }
      const sharedSecret = b58Decode(saved.sharedSecret);
      const data = decryptPayload(dataB58, nonceB58, sharedSecret);
      const signedTx = Transaction.from(b58Decode(data.transaction));

      setStatus('confirming');
      const signature = await solanaRpc('sendTransaction', [bytesToBase64(signedTx.serialize()), { encoding: 'base64', skipPreflight: false }]);
      for (let i = 0; i < 40; i++) {
        try {
          const s = await solanaRpc('getSignatureStatus', [signature, { searchTransactionHistory: true }]);
          const cs = s?.value?.confirmationStatus;
          if (cs === 'confirmed' || cs === 'finalized') break;
        } catch {}
        await new Promise((r) => setTimeout(r, 2000));
      }

      const pend = saved.pending;
      const fn = pend.payAsset === 'sol' ? 'verifySolanaDeposit' : 'verifySolanaUsdcDeposit';
      const payload = pend.payAsset === 'sol'
        ? { signature, amount: pend.amount, userWallet: saved.publicKey, expectedLamports: pend.expectedLamports }
        : { signature, amount: pend.amount, userWallet: saved.publicKey, expectedUnits: pend.expectedUnits };
      savePhantomSession({ ...saved, pending: null });
      cleanPhantomUrl();
      await finishVerify(fn, payload, pend.amount);
    } catch (e) {
      setErrMsg('Sign/broadcast failed: ' + (e.message || e));
      setStatus('error');
      cleanPhantomUrl();
    }
  };

  // Connect: generate (or reuse) a dApp x25519 keypair, build the connect
  // universal link, and navigate to it. Phantom opens, the user approves, and
  // redirects back here with the encrypted session.
  const connect = async () => {
    // Prefer the injected provider — it connects with no security block.
    const injected = getInjectedPhantom();
    if (injected) {
      try {
        setStatus('connecting'); setErrMsg('');
        const res = await injected.connect();
        const pub = res?.publicKey?.toString?.() || res?.public_key || res?.publicKey;
        if (!pub) throw new Error('No public key returned');
        setAccount(typeof pub === 'string' ? pub : String(pub));
        setConnectionMethod('injected');
        setStatus('connected');
        return;
      } catch (e) {
        setErrMsg('Connect failed: ' + (e.message || e));
        setStatus('error');
        return;
      }
    }
    // Fallback: universal deep-link (may show Phantom's "malicious dApp" warning
    // for unverified domains on external mobile browsers).
    let saved = loadPhantomSession();
    let dappKp = saved?.dappKeyPair;
    if (!dappKp) {
      const kp = newDappKeyPair();
      dappKp = { publicKey: b58Encode(kp.publicKey), secretKey: b58Encode(kp.secretKey) };
      saved = saved || {};
      savePhantomSession({ ...saved, dappKeyPair: dappKp });
    }
    const params = new URLSearchParams({
      dapp_encryption_public_key: dappKp.publicKey,
      cluster: 'mainnet-beta',
      app_url: window.location.origin,
      redirect_link: buildRedirectLink(amount),
    });
    window.location.href = buildPhantomUrl('connect', params);
  };

  // Send the deposit: build the Solana tx, encrypt it with the shared secret,
  // build the signTransaction universal link, and navigate. Phantom signs and
  // redirects back here with the signed tx.
  // Sign + broadcast via the injected provider (Phantom in-app browser / desktop
  // extension). No deep-link round-trip, no security block.
  const depositInjected = async () => {
    const provider = getInjectedPhantom();
    if (!provider || !account) { setErrMsg('Not connected.'); setStatus('error'); return; }
    if (payAsset === 'sol' && !price) { setErrMsg('Could not fetch SOL price.'); setStatus('error'); return; }
    setStatus('sending'); setErrMsg('');
    try {
      const fromPubkey = new PublicKey(account);
      const toPubkey = new PublicKey(ADMIN_SOL);
      const tx = new Transaction();
      if (payAsset === 'sol') {
        tx.add(SystemProgram.transfer({ fromPubkey, toPubkey, lamports }));
      } else {
        const mint = new PublicKey(USDC_MINT);
        const senderAta = await getAssociatedTokenAddress(mint, fromPubkey);
        const recipientAta = await getAssociatedTokenAddress(mint, toPubkey);
        tx.add(createAssociatedTokenAccountIdempotentInstruction(fromPubkey, recipientAta, toPubkey, mint));
        tx.add(createTransferCheckedInstruction(senderAta, mint, recipientAta, fromPubkey, usdcUnits, USDC_DECIMALS));
      }
      tx.feePayer = fromPubkey;
      const bh = await solanaRpc('getLatestBlockhash', []);
      tx.recentBlockhash = bh?.value?.blockhash;
      const signed = await provider.signTransaction(tx);
      const serialized = signed.serialize();
      setStatus('confirming');
      const signature = await solanaRpc('sendTransaction', [bytesToBase64(serialized), { encoding: 'base64', skipPreflight: false }]);
      for (let i = 0; i < 40; i++) {
        try {
          const s = await solanaRpc('getSignatureStatus', [signature, { searchTransactionHistory: true }]);
          const cs = s?.value?.confirmationStatus;
          if (cs === 'confirmed' || cs === 'finalized') break;
        } catch {}
        await new Promise((r) => setTimeout(r, 2000));
      }
      const fn = payAsset === 'sol' ? 'verifySolanaDeposit' : 'verifySolanaUsdcDeposit';
      const payload = payAsset === 'sol'
        ? { signature, amount, userWallet: account, expectedLamports: lamports }
        : { signature, amount, userWallet: account, expectedUnits: usdcUnits };
      await finishVerify(fn, payload, amount);
    } catch (e) {
      setErrMsg('Send failed: ' + (e.message || e));
      setStatus('error');
    }
  };

  const deposit = async () => {
    if (connectionMethod === 'injected' && getInjectedPhantom()) {
      return depositInjected();
    }
    const saved = loadPhantomSession();
    if (!saved?.session || !saved?.sharedSecret || !saved?.publicKey || !saved?.dappKeyPair) {
      setErrMsg('Not connected.'); setStatus('error'); return;
    }
    if (payAsset === 'sol' && !price) { setErrMsg('Could not fetch SOL price.'); setStatus('error'); return; }
    setStatus('sending'); setErrMsg('');
    try {
      const fromPubkey = new PublicKey(saved.publicKey);
      const toPubkey = new PublicKey(ADMIN_SOL);
      const tx = new Transaction();
      if (payAsset === 'sol') {
        tx.add(SystemProgram.transfer({ fromPubkey, toPubkey, lamports }));
      } else {
        const mint = new PublicKey(USDC_MINT);
        const senderAta = await getAssociatedTokenAddress(mint, fromPubkey);
        const recipientAta = await getAssociatedTokenAddress(mint, toPubkey);
        // Always include the idempotent ATA creation — it's a no-op if the
        // admin's USDC ATA already exists, avoiding a getAccountInfo RPC call
        // (which 403s from the browser on the public Solana endpoint).
        tx.add(createAssociatedTokenAccountIdempotentInstruction(fromPubkey, recipientAta, toPubkey, mint));
        tx.add(createTransferCheckedInstruction(senderAta, mint, recipientAta, fromPubkey, usdcUnits, USDC_DECIMALS));
      }
      tx.feePayer = fromPubkey;
      const bh = await solanaRpc('getLatestBlockhash', []);
      tx.recentBlockhash = bh?.value?.blockhash;
      const serialized = tx.serialize({ requireAllSignatures: false });

      const payload = { session: saved.session, transaction: b58Encode(serialized) };
      const sharedSecret = b58Decode(saved.sharedSecret);
      const [nonce, encrypted] = encryptPayload(payload, sharedSecret);
      const params = new URLSearchParams({
        dapp_encryption_public_key: saved.dappKeyPair.publicKey,
        nonce: b58Encode(nonce),
        app_url: window.location.origin,
        redirect_link: buildRedirectLink(amount),
        payload: b58Encode(encrypted),
      });
      savePhantomSession({ ...saved, pending: { payAsset, amount, expectedLamports: lamports, expectedUnits: usdcUnits } });
      window.location.href = buildPhantomUrl('signTransaction', params);
    } catch (e) {
      setErrMsg('Build failed: ' + (e.message || e));
      setStatus('error');
    }
  };

  const disconnect = async () => {
    if (connectionMethod === 'injected') {
      const injected = getInjectedPhantom();
      if (injected) { try { await injected.disconnect(); } catch {} }
    }
    clearPhantomSession();
    setAccount(null);
    setConnectionMethod('deeplink');
    setErrMsg('');
    setStatus('idle');
  };

  // On mount: process a Phantom deep-link return (connect or sign), or restore
  // an existing session. Runs once.
  useEffect(() => {
    getCryptoPrices().then((p) => setPrice(p.sol || 0)).catch(() => {});
    setHasInjected(!!getInjectedPhantom());
    const sp = new URLSearchParams(window.location.search);
    const errorCode = sp.get('errorCode');
    const phantomEncPub = sp.get('phantom_encryption_public_key');
    const nonceB58 = sp.get('nonce');
    const dataB58 = sp.get('data');

    if (errorCode) {
      setErrMsg('Phantom: ' + (sp.get('errorMessage') || errorCode));
      setStatus('error');
      cleanPhantomUrl();
      return;
    }
    if (phantomEncPub && nonceB58 && dataB58) { handleConnectReturn(phantomEncPub, nonceB58, dataB58); return; }
    if (nonceB58 && dataB58) { handleSignReturn(nonceB58, dataB58); return; }

    const saved = loadPhantomSession();
    if (saved?.publicKey && saved?.session) {
      setAccount(saved.publicKey);
      setStatus('connected');
    }
    if (saved?.pending) savePhantomSession({ ...saved, pending: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const busy = ['sending', 'confirming', 'verifying'].includes(status);
  const statusText = {
    sending: 'Opening Phantom to sign…',
    confirming: 'Waiting for blockchain confirmation…',
    verifying: 'Verifying and adding balance…',
  }[status];
  const amountSub = payAsset === 'sol'
    ? (price ? `≈ ${solAmt.toFixed(5)} SOL (Native)` : 'Fetching SOL price…')
    : `${amount.toFixed(2)} USDC (SPL)`;

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: SANS, animation: 'dashFadeIn 350ms ease both' }}>
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 overflow-hidden" style={{ background: '#7868e6', boxShadow: '0 0 0 1.5px rgba(171,159,242,0.4)' }}>
          <img src={PHANTOM_LOGO} alt="Phantom" className="w-7 h-7 object-contain" />
        </div>
        <h1 className="text-base font-extrabold" style={{ color: PHANTOM_PURPLE }}>Phantom · Solana Deposit</h1>
      </div>

      {/* Payment coin segmented control */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(212,175,55,0.85)' }}>Payment Coin</label>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setPayAsset('usdc')} disabled={netLocked}
            className="h-12 rounded-[14px] text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
            style={payAsset === 'usdc'
              ? { background: 'linear-gradient(135deg, #FFD700, #C89B3C)', color: '#1a1408', border: '1px solid rgba(255,215,0,0.6)', boxShadow: '0 4px 14px rgba(200,155,60,0.4)' }
              : { background: 'rgba(255,255,255,0.03)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
            USDC
          </button>
          <button onClick={() => setPayAsset('sol')} disabled={netLocked}
            className="h-12 rounded-[14px] text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
            style={payAsset === 'sol'
              ? { background: 'linear-gradient(135deg, #FFD700, #C89B3C)', color: '#1a1408', border: '1px solid rgba(255,215,0,0.6)', boxShadow: '0 4px 14px rgba(200,155,60,0.4)' }
              : { background: 'rgba(255,255,255,0.03)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
            SOL (Native)
          </button>
        </div>
      </div>

      {/* Deposit amount card */}
      <div className="dash-card p-5 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, rgba(171,159,242,0.10), rgba(20,241,149,0.06), rgba(255,255,255,0.03))', border: '1px solid rgba(171,159,242,0.4)', boxShadow: '0 0 24px rgba(171,159,242,0.16), 0 8px 24px rgba(0,0,0,0.5)' }}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(171,159,242,0.85)' }}>Depositing</p>
          <p className="text-3xl font-extrabold tabular-nums mt-0.5" style={{ color: '#fff' }}>${amount.toFixed(2)}</p>
          <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{amountSub}</p>
        </div>
        <div className="flex items-center justify-center w-12 h-12 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg, #AB9FF2, #14f195)', boxShadow: '0 0 18px rgba(171,159,242,0.5)' }}>
          <Wallet className="w-6 h-6" style={{ color: '#fff' }} />
        </div>
      </div>

      {/* Connected account */}
      {account && (
        <div className="dash-card px-4 py-2.5 flex items-center justify-between gap-2" style={{ border: '1px solid rgba(171,159,242,0.25)' }}>
          <span className="text-[12px] font-mono break-all" style={{ color: 'rgba(255,255,255,0.85)' }}>✓ Connected: {account}</span>
          {!busy && (
            <button onClick={disconnect}
              className="shrink-0 flex items-center gap-1 px-3 h-8 rounded-[12px] text-[11px] font-bold transition-all active:scale-95"
              style={{ border: '1px solid rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.12)', color: '#fca5a5' }}>
              <LogOut className="w-3.5 h-3.5" /> Disconnect
            </button>
          )}
        </div>
      )}

      {/* Busy status */}
      {busy && (
        <div className="dash-card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: PHANTOM_PURPLE }}>
            <Loader2 className="w-4 h-4 animate-spin" /> {statusText}
          </div>
          {status === 'sending' && (
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
              The Phantom app should open to approve the {payAsset === 'sol' ? `${solAmt.toFixed(5)} SOL` : `${amount.toFixed(2)} USDC`} transfer. Sign it there, then you'll return here automatically.
            </p>
          )}
        </div>
      )}

      {/* Idle action buttons */}
      {status === 'idle' && (
        <div className="flex flex-col gap-2.5">
          <button onClick={connect}
            className="w-full flex items-center justify-center gap-2 h-14 rounded-[16px] font-extrabold transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #AB9FF2, #7B6FE8)', color: '#fff', boxShadow: '0 6px 20px rgba(171,159,242,0.4)' }}>
            <Wallet className="w-5 h-5" /> Connect with Phantom
          </button>
          <p className="text-[12px] text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {hasInjected
              ? 'Tap to connect your Phantom wallet and approve the deposit.'
              : 'For a reliable connection, open this page inside Phantom\'s in-app browser (Phantom app → Browser icon → enter this site\'s URL). On an external browser, Phantom may block the connection as an unverified dApp.'}
          </p>
          <a href="https://phantom.app/download" target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 h-12 rounded-[16px] font-bold transition-all active:scale-[0.98]"
            style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#fff' }}>
            <ExternalLink className="w-5 h-5" style={{ color: PHANTOM_PURPLE }} /> Install Phantom
          </a>
        </div>
      )}

      {/* Connected — send */}
      {status === 'connected' && (
        <button onClick={deposit}
          className="w-full flex items-center justify-center gap-2 h-14 rounded-[16px] font-extrabold transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', color: '#06281f', boxShadow: '0 6px 20px rgba(52,211,153,0.4)' }}>
          <ArrowRight className="w-5 h-5" /> Send {payAsset === 'sol' ? `${solAmt.toFixed(5)} SOL` : `${amount.toFixed(2)} USDC`} from wallet
        </button>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-[14px] text-[13px]"
            style={{ border: '1px solid rgba(244,63,94,0.35)', background: 'rgba(244,63,94,0.1)', color: '#fca5a5' }}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{errMsg}</span>
          </div>
          <button onClick={() => { setErrMsg(''); setStatus(account ? 'connected' : 'idle'); }}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-[16px] font-bold transition-all active:scale-[0.98]"
            style={{ border: '1px solid rgba(171,159,242,0.4)', background: 'rgba(171,159,242,0.10)', color: PHANTOM_PURPLE }}>
            <Wallet className="w-5 h-5" /> Try Again
          </button>
        </div>
      )}

      {/* Done */}
      {status === 'done' && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-[14px] text-sm font-bold"
          style={{ border: '1px solid rgba(52,211,153,0.4)', background: 'rgba(52,211,153,0.12)', color: '#6ee7b7' }}>
          <CheckCircle2 className="w-5 h-5" /> Deposit successful!
        </div>
      )}
    </div>
  );
}