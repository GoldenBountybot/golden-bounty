import React, { useState, useEffect } from 'react';
import { Download, ExternalLink, ClipboardCopy } from 'lucide-react';
import { buildNewCurrencyXls, buildNewCurrencyForm } from '@/lib/pgNewCurrencyForm';

// Admin-only tool: generates the PG SOFT "New Currency" request sheet
// (add USD alongside the live USDT setup) pre-filled and correct, and
// downloads it in the exact same structure as PG SOFT's template.
export default function AdminPgCurrency() {
  const [operatorToken, setOperatorToken] = useState('');
  const [server, setServer] = useState('');

  const fileUrl = () => {
    const html = buildNewCurrencyXls({ operatorToken, server });
    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel' });
    return URL.createObjectURL(blob);
  };

  const download = () => {
    const url = fileUrl();
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PG_Soft_New_Currency_USD_GoldenBounty.xls';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  // In-app previews / Telegram WebView block programmatic window.open, but a
  // REAL anchor the user taps is always allowed — so the link below is a live
  // <a> element pointing at the generated file, opening in a new tab where the
  // browser downloads it.
  const [linkUrl, setLinkUrl] = useState('');
  useEffect(() => {
    const url = fileUrl();
    setLinkUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [operatorToken, server]);

  // Last-resort path: previews and in-app WebViews block both downloads and
  // new tabs. The text below can be selected and pasted straight into Excel —
  // tabs become columns, so the sheet comes out identical.
  const tsv = buildNewCurrencyForm({ operatorToken, server })
    .map((r) => r.map((c) => String(c ?? '').replace(/\n/g, ' ')).join('\t'))
    .join('\n');
  const [copied, setCopied] = useState(false);

  const copyTsv = async () => {
    try {
      await navigator.clipboard.writeText(tsv);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = tsv;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputStyle = { fontFamily: 'Georgia, serif' };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[10px] p-4" style={{ border: '1px solid rgba(214,178,98,0.3)', background: 'rgba(20,17,13,0.6)' }}>
        <p className="text-amber-200 font-bold italic mb-1" style={inputStyle}>PG SOFT — New Currency (USD)</p>
        <p className="text-[11px] text-amber-100/60 italic leading-relaxed" style={inputStyle}>
          Fills the "New Currency" sheet only. Brand, endpoints, IPs and test-site details are copied
          from the live USDT submission — nothing about the existing setup changes. Target launch date
          is set to 2026-08-30.
        </p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-bold italic text-amber-200" style={inputStyle}>Operator Token (from PG BackOffice)</span>
        <input
          value={operatorToken}
          onChange={(e) => setOperatorToken(e.target.value)}
          placeholder="e.g. abc123..."
          className="dash-input px-3 py-2 text-sm"
          style={inputStyle}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-bold italic text-amber-200" style={inputStyle}>Server (BackOffice dropdown value)</span>
        <input
          value={server}
          onChange={(e) => setServer(e.target.value)}
          placeholder="e.g. NMGA"
          className="dash-input px-3 py-2 text-sm"
          style={inputStyle}
        />
      </label>

      <button
        type="button"
        onClick={download}
        className="dash-btn-gold flex items-center justify-center gap-2 py-3 text-sm"
      >
        <Download className="w-4 h-4" />
        Download New Currency Form
      </button>

      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        download="PG_Soft_New_Currency_USD_GoldenBounty.xls"
        className="flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[12px] font-bold italic"
        style={{ border: '1px solid rgba(214,178,98,0.5)', background: 'rgba(20,17,13,0.6)', color: '#e8c878', fontFamily: 'Georgia, serif' }}
      >
        <ExternalLink className="w-4 h-4" />
        নতুন ট্যাবে খুলে ডাউনলোড করুন
      </a>

      <button
        type="button"
        onClick={copyTsv}
        className="flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[12px] font-bold italic"
        style={{ border: '1px solid rgba(214,178,98,0.5)', background: 'rgba(20,17,13,0.6)', color: '#e8c878', fontFamily: 'Georgia, serif' }}
      >
        <ClipboardCopy className="w-4 h-4" />
        {copied ? 'কপি হয়েছে ✓' : 'কপি করুন — Excel-এ পেস্ট করুন'}
      </button>

      <textarea
        readOnly
        value={tsv}
        onFocus={(e) => e.target.select()}
        className="dash-input px-3 py-2 text-[10px] leading-relaxed"
        style={{ fontFamily: 'monospace', height: 220, whiteSpace: 'pre' }}
      />
    </div>
  );
}