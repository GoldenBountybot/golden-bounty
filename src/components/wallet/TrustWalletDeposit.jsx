import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useToast } from '@/components/ui/use-toast';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import { Wallet, Loader2, CheckCircle2, AlertTriangle, ChevronLeft, ArrowRight } from 'lucide-react';

// Trust Wallet (and any injected EVM wallet) deposit on BNB Smart Chain USDT.
// No external package needed — uses the browser-injected EIP-1193 provider.
const BSC_PARAMS = {
  chainId: '0x38',
  chainName: 'BNB Smart Chain',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: ['https://bsc-dataseed.binance.org'],
  blockExplorerUrls: ['https://bscscan.com'],
};
const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955'; // BSC USDT (18 decimals)
const ADMIN_BSC = '0xbe44b1608cd0a7e7f18166d18ad2c21a61bd6570';      // admin receiving wallet

function getProvider() {
  if (typeof window === 'undefined') return null;
  return window.trustwallet || window.ethereum || null;
}

function toHexAmount(usd) {
  const wei = BigInt(Math.round(usd * 1e18));
  return '0x' + wei.toString(16);
}
function pad32(addr) {
  let h = String(addr).toLowerCase().replace(/^0x/, '');
  while (h.length < 64) h = '0' + h;
  return '0x' + h;
}

export default function TrustWalletDeposit({ amount, onBack, onDone }) {
  const { setBalance } = useCasinoBalance();
  const { toast } = useToast();
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState('idle'); // idle|connecting|connected|sending|confirming|verifying|done|error
  const [errMsg, setErrMsg] = useState('');

  const connect = async () => {
    const p = getProvider();
    if (!p) { setErrMsg('Trust Wallet (বা অন্য EVM ওয়ালেট) এই ব্রাউজারে ইনস্টল নেই। এক্সটেনশন ইনস্টল করুন।'); setStatus('error'); return; }
    setStatus('connecting'); setErrMsg('');
    try {
      const accts = await p.request({ method: 'eth_requestAccounts' });
      setAccount(accts[0]);
      try {
        await p.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BSC_PARAMS.chainId }] });
      } catch (e) {
        if (e && (e.code === 4902 || e.code === -32603)) {
          await p.request({ method: 'wallet_addEthereumChain', params: [BSC_PARAMS] });
        } else { throw e; }
      }
      setStatus('connected');
    } catch {
      setErrMsg('ওয়ালেট কানেকশন বাতিল হয়েছে।'); setStatus('error');
    }
  };

  const deposit = async () => {
    const p = getProvider(); if (!p || !account) return;
    setStatus('sending'); setErrMsg('');
    try {
      const data = '0xa9059cbb' + pad32(ADMIN_BSC).slice(2) + pad32(toHexAmount(amount)).slice(2);
      const txHash = await p.request({
        method: 'eth_sendTransaction',
        params: [{ from: account, to: USDT_CONTRACT, data }],
      });
      // wait for on-chain confirmation via the wallet provider
      setStatus('confirming');
      let receipt = null;
      for (let i = 0; i < 45; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        receipt = await p.request({ method: 'eth_getTransactionReceipt', params: [txHash] });
        if (receipt) break;
      }
      if (!receipt) { setErrMsg('লেনদেন এখনও কনফার্ম হয়নি, কিছুক্ষণ পর আবার চেষ্টা করুন।'); setStatus('error'); return; }
      if (receipt.status !== '0x1') { setErrMsg('লেনদেন ব্যর্থ হয়েছে (reverted)।'); setStatus('error'); return; }

      // backend verifies the transfer on-chain + credits (idempotent)
      setStatus('verifying');
      const res = await base44.functions.invoke('verifyEvmDeposit', { txHash, amount, userWallet: account });
      if (res?.data?.ok) {
        if (!res.data.already) setBalance((b) => b + Number(res.data.amount || amount));
        setStatus('done');
        toast({ title: 'ডিপোজিট সফল', description: `$${Number(res.data.amount || amount).toFixed(2)} ব্যালেন্সে যোগ হয়েছে।` });
        setTimeout(() => onDone?.(), 1200);
      } else {
        const reason = res?.data?.reason || 'unknown';
        setErrMsg(reason === 'pending' ? 'লেনদেন এখনও পেন্ডিং — কিছুক্ষণ পর আবার চেষ্টা করুন।' : `ভেরিফিকেশন ব্যর্থ: ${reason}`);
        setStatus('error');
      }
    } catch (e) {
      setErrMsg('লেনদেন বাতিল বা ব্যর্থ হয়েছে।');
      setStatus('error');
    }
  };

  const busy = ['connecting', 'sending', 'confirming', 'verifying'].includes(status);
  const statusText = {
    connecting: 'ওয়ালেট কানেক্ট হচ্ছে…',
    sending: 'ওয়ালেটে লেনদেন রিকোয়েস্ট পাঠানো হচ্ছে…',
    confirming: 'ব্লকচেইনে কনফার্মেশনের জন্য অপেক্ষা…',
    verifying: 'ভেরিফিকেশন ও ব্যালেন্স যোগ হচ্ছে…',
  }[status];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md italic font-bold border border-amber-600/80 text-amber-200 bg-black/40 active:scale-95" style={{ fontFamily: 'Georgia, serif' }}>
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-base font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Trust Wallet Deposit</h1>
      </div>

      <WesternFrame glow variant="glass" className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-widest uppercase text-amber-300/70">Depositing</p>
          <p className="text-2xl font-black italic text-yellow-100 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>${amount.toFixed(2)}</p>
          <p className="text-[11px] text-amber-100/50 italic">BSC · USDT (BEP20)</p>
        </div>
        <Wallet className="w-8 h-8 text-amber-400/60" />
      </WesternFrame>

      {account && (
        <div className="px-3 py-2 rounded-md border border-amber-700/40 bg-black/30 text-[11px] text-amber-100/80 font-mono break-all">
          ✓ Connected: {account}
        </div>
      )}

      {busy && (
        <div className="flex items-center gap-2 text-amber-200 text-sm italic" style={{ fontFamily: 'Georgia, serif' }}>
          <Loader2 className="w-4 h-4 animate-spin" /> {statusText}
        </div>
      )}

      {status === 'idle' && (
        <button onClick={connect} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 font-black italic active:scale-[0.98]" style={{ fontFamily: 'Georgia, serif' }}>
          <Wallet className="w-5 h-5" /> Connect Trust Wallet
        </button>
      )}

      {status === 'connected' && (
        <button onClick={deposit} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-stone-950 font-black italic active:scale-[0.98]" style={{ fontFamily: 'Georgia, serif' }}>
          <ArrowRight className="w-5 h-5" /> ওয়ালেট থেকে ${amount.toFixed(2)} পাঠান
        </button>
      )}

      {status === 'error' && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-md border border-rose-700/50 bg-rose-950/40 text-rose-200 text-xs italic" style={{ fontFamily: 'Georgia, serif' }}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{errMsg}</span>
        </div>
      )}

      {status === 'done' && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-emerald-700/50 bg-emerald-950/40 text-emerald-200 text-sm italic font-bold" style={{ fontFamily: 'Georgia, serif' }}>
          <CheckCircle2 className="w-5 h-5" /> ডিপোজিট সফল হয়েছে!
        </div>
      )}

      <p className="text-[10px] text-amber-100/40 italic text-center">
        কানেক্ট করে কনফার্ম দিলে আপনার ওয়ালেট থেকে সরাসরি অ্যাডমিনের ওয়ালেটে USDT চলে যাবে এবং ব্যালেন্স অটো যোগ হবে।
      </p>
    </div>
  );
}