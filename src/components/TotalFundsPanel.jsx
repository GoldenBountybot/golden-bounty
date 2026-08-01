import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

// Live "Total Funds" panel for the Stack tab.
// Starts at 35,000,000 USDT and ramps to 36,000,000 over 10 days (real elapsed
// time, persisted via localStorage so it survives reloads). A live feed of
// random +/− amounts scrolls beneath it — additions outnumber subtractions so
// the visible activity always feels net-positive, matching the upward trend.

const BASE = 35_000_000;
const TARGET = 36_000_000;
const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
const START_KEY = 'gb_total_funds_start';

const START_TS = (() => {
  try {
    const v = localStorage.getItem(START_KEY);
    if (v) return Number(v);
    const now = Date.now();
    localStorage.setItem(START_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
})();

// Random amount like the examples: 44, 120, 500, 2000 — wide spread.
function randAmount() {
  const tiers = [20, 60, 120, 300, 500, 1200, 2000, 4500];
  const t = tiers[Math.floor(Math.random() * tiers.length)];
  return Math.round(t + (Math.random() * t * 0.4));
}

function makeEntry() {
  // ~55% additions, 45% subtractions → nearly even, slightly more additions.
  const positive = Math.random() < 0.55;
  const amount = randAmount();
  return {
    id: Math.random().toString(36).slice(2),
    positive,
    amount,
    time: Date.now(),
  };
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return 'now';
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h`;
}

export default function TotalFundsPanel() {
  const [total, setTotal] = useState(BASE);
  const [feed, setFeed] = useState(() => Array.from({ length: 6 }, makeEntry));
  const [pulse, setPulse] = useState(null); // {positive, amount} for flash
  const tickRef = useRef(0);

  // Increase by 1M every 10 days, continuously (35M → 36M → 37M → ...).
  useEffect(() => {
    let raf;
    const update = () => {
      const elapsed = Date.now() - START_TS;
      const cycles = Math.floor(elapsed / TEN_DAYS_MS);
      const within = (elapsed % TEN_DAYS_MS) / TEN_DAYS_MS; // 0..1 in current cycle
      const ramped = BASE + cycles * (TARGET - BASE) + (TARGET - BASE) * within;
      // tiny live jitter so the number feels alive
      const jitter = (Math.sin(elapsed / 900) * 250) + (Math.random() * 400 - 200);
      setTotal(ramped + jitter);
      raf = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(raf);
  }, []);

  // Push a new random transaction every 2.2–4s.
  useEffect(() => {
    let timer;
    const schedule = () => {
      const delay = 700 + Math.random() * 700;
      timer = setTimeout(() => {
        const e = makeEntry();
        setFeed(prev => [e, ...prev].slice(0, 7));
        setPulse(e);
        setTimeout(() => setPulse(null), 900);
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  // refresh "x ago" labels every 15s
  useEffect(() => {
    const i = setInterval(() => setFeed(prev => [...prev]), 15000);
    return () => clearInterval(i);
  }, []);

  const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      className="dash-card relative overflow-hidden p-5"
      style={{ animation: 'dashFadeIn 400ms ease both', background: 'linear-gradient(135deg, rgba(38,161,123,0.10), rgba(255,255,255,0.03))', border: '1px solid rgba(38,161,123,0.35)' }}
    >
      <div className="pointer-events-none absolute -top-12 -right-10 w-44 h-44 rounded-full" style={{ background: 'radial-gradient(circle, rgba(38,161,123,0.22), transparent 70%)' }} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/9/9a/Tether_USDT_logo.svg"
            alt="USDT"
            className="w-6 h-6 rounded-full"
            style={{ filter: 'drop-shadow(0 0 4px rgba(38,161,123,0.6))' }}
          />
          <p className="text-[13px] font-extrabold uppercase tracking-[0.2em]" style={{ color: 'rgba(38,161,123,0.95)' }}>Total Funds</p>
        </div>
      </div>

      {/* Big total */}
      <div className="mt-2 flex items-end gap-2">
        <span className="text-3xl font-extrabold tabular-nums italic" style={{ color: '#fff', fontFamily: 'Georgia, serif' }}>
          ${fmt(total)}
        </span>
        <span className="text-[11px] font-bold text-emerald-300/80 mb-1">USDT+</span>
      </div>

      {/* 10-day progress to 36M */}
      <div className="mt-3">
      </div>

      {/* Live feed */}
      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>Live Activity</p>
        <div className="flex flex-col gap-1.5">
          {feed.map((e, idx) => {
            const newest = idx === 0;
            return (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-lg px-2.5 py-1.5"
                style={{
                  animation: newest && pulse?.id === e.id ? 'dashFadeIn 300ms ease both' : undefined,
                  background: newest && pulse?.id === e.id
                    ? (e.positive ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)')
                    : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${e.positive ? 'rgba(52,211,153,0.18)' : 'rgba(248,113,113,0.18)'}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full"
                    style={{ background: e.positive ? 'rgba(52,211,153,0.14)' : 'rgba(248,113,113,0.14)' }}>
                    {e.positive
                      ? <TrendingUp className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
                      : <TrendingDown className="w-3.5 h-3.5" style={{ color: '#f87171' }} />}
                  </span>
                  <span className="text-[11px] font-bold tabular-nums" style={{ color: e.positive ? '#34d399' : '#f87171' }}>
                    {e.positive ? '+' : '−'}${e.amount.toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] tabular-nums" style={{ color: 'rgba(255,255,255,0.4)' }}>{timeAgo(e.time)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}