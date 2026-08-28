import React, { useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { buildNewCurrencyXls } from '@/lib/pgNewCurrencyForm';

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

  // In-app previews / Telegram WebView often block direct downloads. Opening
  // the file in a real browser tab always works — the browser saves it there.
  const openInTab = () => {
    const url = fileUrl();
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
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

      <button
        type="button"
        onClick={openInTab}
        className="flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[12px] font-bold italic"
        style={{ border: '1px solid rgba(214,178,98,0.5)', background: 'rgba(20,17,13,0.6)', color: '#e8c878', fontFamily: 'Georgia, serif' }}
      >
        <ExternalLink className="w-4 h-4" />
        ডাউনলোড না হলে — নতুন ট্যাবে খুলুন
      </button>
    </div>
  );
}