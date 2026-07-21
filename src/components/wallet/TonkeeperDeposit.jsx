import React, { useState, useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { beginCell, Address, toNano } from '@ton/core';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useToast } from '@/components/ui/use-toast';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import { Wallet, Loader2, CheckCircle2, AlertTriangle, ChevronLeft, ArrowRight, Smartphone } from 'lucide-react';
import { TON_USDT_DECIMALS, TON_ADMIN, getUserJettonWallet } from '@/lib/tonConfig';
import { getCryptoPrices } from '@/lib/cryptoPrices';

// Jetton transfer op code: transfer#0f8a7ea5
const JETTON_TRANSFER_OP = 0x0f8a7ea5;

export default function TonkeeperDeposit({ amount, onBack, onDone }) {
  const { setBalance } = useCasinoBalance();
  const { toast } = useToast();
  const [tonConnectUI] = useTonConnectUI();
  const [account, setAccount] = useState(tonConnectUI?.account || null);
  const [connected, setConnected] = useState(!!tonConnectUI?.connected);
  const [payAsset, setPayAsset] = useState('usdt'); // 'usdt' | 'ton'
  const [price, setPrice] = useState(0);
  const [status, setStatus] = useState('idle'); // idle|sending|verifying|done|error
  const [errMsg, setErrMsg] = useState('');

  const coinAmt = price ? amount / price : 0;

  useEffect(() => {
    if (payAsset === 'ton') getCryptoPrices().then((p) => setPrice(p.ton || 0)).catch(() => {});
  }, [payAsset]);

  useEffect(() => {
    if (!tonConnectUI) return;
    setAccount(tonConnectUI.account || null);
    setConnected(!!tonConnectUI.connected);
    const unsub = tonConnectUI.onStatusChange((wallet) => {
      setAccount(wallet?.account || null);
      setConnected(!!wallet);
    });
    return unsub;
  }, [tonConnectUI]);

  const deposit = async () => {
    if (!connected || !account?.address) return;
    if (!amount || amount <= 0) { setErrMsg('No deposit amount selected — please choose an amount from the dashboard.'); setStatus('error'); return; }
    setStatus('sending'); setErrMsg('');
    try {
      let expectedNano;
      if (payAsset === 'ton') {
        // Native TON transfer: $ amount → equivalent TON at live price.
        const pr = price || (await getCryptoPrices()).ton || 0;
        if (!pr) { setErrMsg('Could not fetch TON price. Please try again.'); setStatus('error'); return; }
        expectedNano = BigInt(Math.round((amount / pr) * 1e9));
        await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 300,
          messages: [{ address: TON_ADMIN, amount: expectedNano.toString() }],
        });
      } else {
        // 1. Resolve the user's USDT jetton wallet (destination of the transfer message).
        const jwRaw = await getUserJettonWallet(account.address);
        if (!jwRaw) {
          setErrMsg('No USDT (TON) found in your wallet. Add USDT first.');
          setStatus('error'); return;
        }
        const jettonWallet = Address.parse(jwRaw).toString();
        const admin = Address.parse(TON_ADMIN);

        // 2. Build the jetton transfer body: transfer(query_id, amount, dest, resp, fwd_ton).
        const queryId = crypto.getRandomValues(new BigUint64Array(1))[0];
        const nanoAmount = BigInt(Math.round(amount * Math.pow(10, TON_USDT_DECIMALS)));
        const body = beginCell()
          .storeUint(JETTON_TRANSFER_OP, 32)
          .storeUint(queryId, 64)
          .storeCoins(nanoAmount)
          .storeAddress(admin)              // destination (admin)
          .storeAddress(Address.parse(account.address)) // response_destination (excess → user)
          .storeBit(0)                       // no custom_payload
          .storeCoins(toNano('0.01'))        // forward_ton_amount
          .storeBit(0)                       // no forward_payload
          .endCell();
        const bocBytes = body.toBoc({ idx: false });
        let binary = '';
        for (let i = 0; i < bocBytes.length; i++) binary += String.fromCharCode(bocBytes[i]);
        const payload = btoa(binary);

        // 3. Send via TON Connect → Tonkeeper signs & broadcasts.
        await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 300,
          messages: [{ address: jettonWallet, amount: toNano('0.1').toString(), payload }],
        });
      }

      // 4. Verify on backend (polls admin's wallet for the incoming transfer).
      setStatus('verifying');
      const fn = payAsset === 'ton' ? 'verifyTonNativeDeposit' : 'verifyTonDeposit';
      const verifyPayload = payAsset === 'ton'
        ? { userWallet: account.address, amount, expectedNano: String(expectedNano) }
        : { userWallet: account.address, amount };
      const res = await base44.functions.invoke(fn, verifyPayload);
      if (res?.data?.ok) {
        if (!res.data.already) setBalance((b) => b + Number(res.data.amount || amount));
        setStatus('done');
        toast({ title: 'Deposit successful', description: `$${Number(res.data.amount || amount).toFixed(2)} has been added to your balance.` });
        setTimeout(() => onDone?.(), 1200);
      } else {
        const reason = res?.data?.reason || 'unknown';
        setErrMsg(reason === 'pending' ? 'Transaction is not confirmed yet — please try again shortly.' : `Verification failed: ${reason}`);
        setStatus('error');
      }
    } catch (e) {
      console.error('TonkeeperDeposit error:', e);
      const msg = e?.message || (typeof e === 'string' ? e : 'cancelled/failed');
      setErrMsg('Transaction cancelled/failed: ' + msg);
      setStatus('error');
    }
  };

  const busy = ['sending', 'verifying'].includes(status);
  const statusText = {
    sending: 'Sending transaction request to Tonkeeper…',
    verifying: 'Waiting for blockchain confirmation and adding balance…',
  }[status];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md italic font-bold border border-amber-600/80 text-amber-200 bg-black/40 active:scale-95" style={{ fontFamily: 'Georgia, serif' }}>
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-base font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Tonkeeper (TON) Deposit</h1>
      </div>

      <WesternFrame glow variant="glass" className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-widest uppercase text-amber-300/70">Depositing</p>
          <p className="text-2xl font-black italic text-yellow-100 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>${amount.toFixed(2)}</p>
          <p className="text-[11px] text-amber-100/50 italic">{payAsset === 'ton' ? `≈ ${coinAmt.toFixed(5)} TON (Native)` : 'USDT · TON Network (Jetton)'}</p>
        </div>
        <Wallet className="w-8 h-8 text-amber-400/60" />
      </WesternFrame>

      {connected && account?.address && (
        <div className="px-3 py-2 rounded-md border border-amber-700/40 bg-black/30 text-[11px] text-amber-100/80 font-mono break-all">
          ✓ Connected: {account.address}
        </div>
      )}

      {busy && (
        <div className="flex items-center gap-2 p-3 rounded-md border border-amber-700/40 bg-black/30 text-amber-200 text-sm italic" style={{ fontFamily: 'Georgia, serif' }}>
          <Loader2 className="w-4 h-4 animate-spin" /> {statusText}
          {status === 'sending' && (
            <p className="text-[12px] text-amber-100/80 italic ml-2">Confirm the transaction in the Tonkeeper app. A small amount of TON is needed for gas.</p>
          )}
        </div>
      )}

      {status === 'idle' && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setPayAsset('usdt')} className={`px-3 py-2 rounded-md text-sm font-bold italic border ${payAsset === 'usdt' ? 'bg-amber-400 text-stone-950 border-amber-300' : 'bg-black/40 text-amber-200 border-amber-700/40'}`} style={{ fontFamily: 'Georgia, serif' }}>USDT (Jetton)</button>
            <button onClick={() => setPayAsset('ton')} className={`px-3 py-2 rounded-md text-sm font-bold italic border ${payAsset === 'ton' ? 'bg-amber-400 text-stone-950 border-amber-300' : 'bg-black/40 text-amber-200 border-amber-700/40'}`} style={{ fontFamily: 'Georgia, serif' }}>TON (Native)</button>
          </div>
          {!connected ? (
            <button onClick={() => tonConnectUI?.openModal()} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black italic active:scale-[0.98]" style={{ fontFamily: 'Georgia, serif' }}>
              <Smartphone className="w-5 h-5" /> Connect Tonkeeper
            </button>
          ) : (
            <button onClick={deposit} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-stone-950 font-black italic active:scale-[0.98]" style={{ fontFamily: 'Georgia, serif' }}>
              <ArrowRight className="w-5 h-5" /> Send {payAsset === 'ton' ? `${coinAmt.toFixed(5)} TON` : `$${amount.toFixed(2)} USDT`} from wallet
            </button>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-md border border-rose-700/50 bg-rose-950/40 text-rose-200 text-xs italic" style={{ fontFamily: 'Georgia, serif' }}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{errMsg}</span>
        </div>
      )}

      {status === 'done' && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-emerald-700/50 bg-emerald-950/40 text-emerald-200 text-sm italic font-bold" style={{ fontFamily: 'Georgia, serif' }}>
          <CheckCircle2 className="w-5 h-5" /> Deposit successful!
        </div>
      )}

      <p className="text-[10px] text-amber-100/40 italic text-center">
        Upon confirmation, {payAsset === 'ton' ? 'TON (Native)' : 'USDT'} will be sent from your Tonkeeper to the admin's TON wallet and your balance will be credited automatically. Keep a small amount of TON in your wallet for gas.
      </p>
    </div>
  );
}