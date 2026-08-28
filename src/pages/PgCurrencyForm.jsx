import React, { useState } from 'react';
import { Download } from 'lucide-react';

const SHEET_TITLE = 'New Currency';

function rows(operatorToken, server) {
  return [
    ['Basic / 基本资料', '*Brand Name /品牌名称', 'GoldenBounty'],
    ['', '* Parent Operator / 总代理', 'PG'],
    ['', '* Operator Token / 运营商OT', operatorToken || ''],
    ['', '* Server / 服务器', server || ''],
    ['', '* Office IP / 办公室IP', '37.111.223.255'],
    ['', '*Operator have a market operation license /运营商是否有市场运营牌照', 'No'],
    ['Setting / 配置信息', '*Choice of Currencies /选择货币', 'USD'],
    ['', '*Person in charge of 1:1000 currency unit / 负责1:1000基础单位的人', 'N/A - USD is used at 1:1, no 1:1000 currency unit'],
    ['', '*Integrate currency USD or SC&GC — Operator request Integrating currency USD or SC&GC', 'Yes - USD'],
    ['', 'Disclaimer agreement / 免责声明', 'We agree to all PG disclaimers regarding Currency = USD. We do not and will not operate in the United States of America. (PG Support to confirm)'],
    ['', '*Integrate Free Game & Bonus — Event Type / 活动类型', 'Free Game + Bonus'],
    ['', 'Reason for Not Integrating Free Games or Bonus Features (or Both)', 'N/A - we integrate both Free Game and Bonus'],
    ['', '*Operator Test site / 运营商测试网站', 'https://golden-bounty.com'],
    ['', '*Operator Test Site Country Restriction / 运营商测试网站地区限制', 'No country restriction on the test site. Blocked countries: United States of America, Japan, Hong Kong.'],
    ['', '*Test Site Language / 测试网址支持语言', 'English'],
    ['', '*Test account&Password / 测试账号&密码', 'Login is via Telegram Mini App only (no email/password, no Google login). Telegram username: @golden_bounty_tg, Telegram ID: 8802067922, player_name used in the API: 869df460-8d78-4da6-aa2f-76d297f2d9e4. Open https://golden-bounty.com/login and tap "Continue with Telegram".'],
    ['', 'Operator request Bypass QAT and direct setup production using existing api', 'No'],
    ['', 'Disclaimer agreement / 免责声明 (Bypass QAT)', 'N/A - we do not request bypass QAT, we will complete QAT first'],
  ];
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function downloadXls(operatorToken, server) {
  const body = rows(operatorToken, server)
    .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
    .join('');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><tr><th colspan="3">Part 1: General Information / Part 1: 通用信息 — ${SHEET_TITLE}</th></tr><tr><th></th><th>Field</th><th>Operator fill up info / 客户填写资料</th></tr>${body}</table></body></html>`;
  const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'GoldenBounty_PG_New_Currency_USD.xls';
  a.click();
  URL.revokeObjectURL(url);
}

export default function PgCurrencyForm() {
  const [token, setToken] = useState('');
  const [server, setServer] = useState('');

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-bold text-amber-300">PG SOFT — New Currency (USD)</h1>
        <p className="mt-1 text-sm text-stone-400">
          নিচের দুটো ঘর পূরণ করে ডাউনলোড করুন। ফাইলটি Excel-এ খুলবে; PG-র ফর্মের New Currency শিটে কপি-পেস্ট করুন।
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Operator Token"
            className="w-full rounded-lg bg-stone-900 border border-stone-700 px-3 py-2 text-sm"
          />
          <input
            value={server}
            onChange={(e) => setServer(e.target.value)}
            placeholder="Server (e.g. Staging / Production)"
            className="w-full rounded-lg bg-stone-900 border border-stone-700 px-3 py-2 text-sm"
          />
        </div>

        <button
          onClick={() => downloadXls(token, server)}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-stone-900"
        >
          <Download className="w-4 h-4" /> Download Excel
        </button>

        <div className="mt-6 overflow-x-auto rounded-lg border border-stone-800">
          <table className="w-full text-xs">
            <tbody>
              {rows(token, server).map((r, i) => (
                <tr key={i} className="border-b border-stone-800 align-top">
                  <td className="px-3 py-2 text-stone-500 whitespace-nowrap">{r[0]}</td>
                  <td className="px-3 py-2 text-stone-300">{r[1]}</td>
                  <td className="px-3 py-2 text-amber-200">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}