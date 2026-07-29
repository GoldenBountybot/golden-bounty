import React, { useState, useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { beginCell, Address, toNano } from '@ton/core';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useToast } from '@/components/ui/use-toast';
import { Wallet, Loader2, CheckCircle2, AlertTriangle, ChevronLeft, ArrowRight, Smartphone, LogOut } from 'lucide-react';
import { TON_USDT_DECIMALS, TON_ADMIN, getUserJettonWallet } from '@/lib/tonConfig';
import { getCryptoPrices } from '@/lib/cryptoPrices';
import { addWagerRequirement } from '@/lib/useCasinoBalance';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

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
        const pr = price || (await getCryptoPrices()).ton || 0;
        if (!pr) { setErrMsg('Could not fetch TON price. Please try again.'); setStatus('error'); return; }
        expectedNano = BigInt(Math.round((amount / pr) * 1e9));
        await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 300,
          messages: [{ address: TON_ADMIN, amount: expectedNano.toString() }],
        });
      } else {
        const jwRaw = await getUserJettonWallet(account.address);
        if (!jwRaw) {
          setErrMsg('No USDT (TON) found in your wallet. Add USDT first.');
          setStatus('error'); return;
        }
        const jettonWallet = Address.parse(jwRaw).toString();
        const admin = Address.parse(TON_ADMIN);

        const queryId = crypto.getRandomValues(new BigUint64Array(1))[0];
        const nanoAmount = BigInt(Math.round(amount * Math.pow(10, TON_USDT_DECIMALS)));
        const body = beginCell()
          .storeUint(JETTON_TRANSFER_OP, 32)
          .storeUint(queryId, 64)
          .storeCoins(nanoAmount)
          .storeAddress(admin)
          .storeAddress(Address.parse(account.address))
          .storeBit(0)
          .storeCoins(toNano('0.01'))
          .storeBit(0)
          .endCell();
        const bocBytes = body.toBoc({ idx: false });
        let binary = '';
        for (let i = 0; i < bocBytes.length; i++) binary += String.fromCharCode(bocBytes[i]);
        const payload = btoa(binary);

        await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 300,
          messages: [{ address: jettonWallet, amount: toNano('0.1').toString(), payload }],
        });
      }

      setStatus('verifying');
      const fn = payAsset === 'ton' ? 'verifyTonNativeDeposit' : 'verifyTonDeposit';
      const verifyPayload = payAsset === 'ton'
        ? { userWallet: account.address, amount, expectedNano: String(expectedNano) }
        : { userWallet: account.address, amount };
      const res = await base44.functions.invoke(fn, verifyPayload);
      if (res?.data?.ok) {
        if (!res.data.already) {
          const credited = Number(res.data.amount || amount);
          setBalance((b) => b + credited);
          addWagerRequirement(credited);
        }
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
    sending: 'Sending transaction request to Ton Wallet…',
    verifying: 'Waiting for blockchain confirmation and adding balance…',
  }[status];

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: SANS, animation: 'dashFadeIn 350ms ease both' }}>
      {/* Header — text unchanged */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="flex items-center gap-1.5 px-4 h-10 rounded-[14px] font-bold transition-all active:scale-95"
          style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}>
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-base font-extrabold" style={{ color: '#D4AF37' }}>Ton Wallet (TON) Deposit</h1>
      </div>

      {/* Deposit amount card */}
      <div className="dash-card p-5 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(255,255,255,0.03))', border: '1px solid rgba(212,175,55,0.4)', boxShadow: '0 0 24px rgba(212,175,55,0.16), 0 8px 24px rgba(0,0,0,0.5)' }}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(212,175,55,0.85)' }}>Depositing</p>
          <p className="text-3xl font-extrabold tabular-nums mt-0.5" style={{ color: '#fff' }}>${amount.toFixed(2)}</p>
          <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{payAsset === 'ton' ? `≈ ${coinAmt.toFixed(5)} TON (Native)` : 'USDT · TON Network (Jetton)'}</p>
        </div>
        <div className="flex items-center justify-center w-12 h-12 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg, #FFD700, #C89B3C)', boxShadow: '0 0 18px rgba(212,175,55,0.5)' }}>
          <Wallet className="w-6 h-6" style={{ color: '#1a1408' }} />
        </div>
      </div>

      {/* Connected account */}
      {connected && account?.address && (
        <div className="dash-card px-4 py-2.5 flex items-center justify-between gap-2">
          <span className="text-[12px] font-mono break-all" style={{ color: 'rgba(255,255,255,0.85)' }}>✓ Connected: {account.address}</span>
          {!busy && (
            <button
              onClick={async () => {
                try { await tonConnectUI?.disconnect(); } catch {}
                setConnected(false);
                setAccount(null);
                setErrMsg('');
                setStatus('idle');
              }}
              className="shrink-0 flex items-center gap-1 px-3 h-8 rounded-[12px] text-[11px] font-bold transition-all active:scale-95"
              style={{ border: '1px solid rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.12)', color: '#fca5a5' }}
            >
              <LogOut className="w-3.5 h-3.5" /> Disconnect
            </button>
          )}
        </div>
      )}

      {/* Busy status */}
      {busy && (
        <div className="dash-card p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#D4AF37' }}>
            <Loader2 className="w-4 h-4 animate-spin" /> {statusText}
          </div>
          {status === 'sending' && (
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>Confirm the transaction in the Ton Wallet app. A small amount of TON is needed for gas.</p>
          )}
        </div>
      )}

      {/* Idle — coin selector + action */}
      {status === 'idle' && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={() => setPayAsset('usdt')}
              className="h-12 rounded-[14px] text-sm font-bold transition-all active:scale-95"
              style={payAsset === 'usdt'
                ? { background: 'linear-gradient(135deg, #FFD700, #C89B3C)', color: '#1a1408', border: '1px solid rgba(255,215,0,0.6)', boxShadow: '0 4px 14px rgba(200,155,60,0.4)' }
                : { background: 'rgba(255,255,255,0.03)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
              USDT (Jetton)
            </button>
            <button onClick={() => setPayAsset('ton')}
              className="h-12 rounded-[14px] text-sm font-bold transition-all active:scale-95"
              style={payAsset === 'ton'
                ? { background: 'linear-gradient(135deg, #FFD700, #C89B3C)', color: '#1a1408', border: '1px solid rgba(255,215,0,0.6)', boxShadow: '0 4px 14px rgba(200,155,60,0.4)' }
                : { background: 'rgba(255,255,255,0.03)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
              TON (Native)
            </button>
          </div>
          {!connected ? (
            <button onClick={() => tonConnectUI?.openModal()}
              className="w-full flex items-center justify-center gap-2 h-14 rounded-[16px] font-extrabold transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', boxShadow: '0 6px 20px rgba(59,130,246,0.4)' }}>
              <Smartphone className="w-5 h-5" /> Connect Ton Wallet
            </button>
          ) : (
            <button onClick={deposit}
              className="w-full flex items-center justify-center gap-2 h-14 rounded-[16px] font-extrabold transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', color: '#06281f', boxShadow: '0 6px 20px rgba(52,211,153,0.4)' }}>
              <ArrowRight className="w-5 h-5" /> Send {payAsset === 'ton' ? `${coinAmt.toFixed(5)} TON` : `$${amount.toFixed(2)} USDT`} from wallet
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-[14px] text-[13px]"
          style={{ border: '1px solid rgba(244,63,94,0.35)', background: 'rgba(244,63,94,0.1)', color: '#fca5a5' }}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{errMsg}</span>
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