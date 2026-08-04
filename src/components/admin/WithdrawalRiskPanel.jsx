import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, ShieldAlert, ShieldCheck, TrendingUp, TrendingDown, Coins, Gift, Users, Gamepad2, AlertTriangle, X } from 'lucide-react';
import WesternFrame from '@/components/wildbounty/WesternFrame';

const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

const LEVEL_STYLE = {
  high: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.4)' },
  medium: { color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.4)' },
  low: { color: '#facc15', bg: 'rgba(250,204,21,0.12)', border: 'rgba(250,204,21,0.4)' },
};

const RISK_STYLE = {
  high: { color: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.45)', icon: ShieldAlert },
  medium: { color: '#fb923c', bg: 'rgba(251,146,60,0.10)', border: 'rgba(251,146,60,0.45)', icon: AlertTriangle },
  low: { color: '#34d399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.45)', icon: ShieldCheck },
};

export default function WithdrawalRiskPanel({ userId, userEmail, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await base44.functions.invoke('getWithdrawalRiskAssessment', { user_id: userId });
        if (active) setData(res.data);
      } catch (e) {
        if (active) setError(e.message || 'Failed to load');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [userId]);

  const riskLevel = !data ? 'low' : data.riskScore >= 60 ? 'high' : data.riskScore >= 30 ? 'medium' : 'low';
  const rs = RISK_STYLE[riskLevel];
  const RiskIcon = rs.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3" style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ animation: 'dashFadeIn 250ms ease both' }}>
        <WesternFrame className="p-4 flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-300" />
              <h2 className="font-black italic text-amber-200 text-base" style={{ fontFamily: 'Georgia, serif' }}>
                Risk Assessment
              </h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/40 border border-amber-700/40 text-amber-100/70 hover:text-amber-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-amber-100/60 truncate">{userEmail || userId}</p>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
            </div>
          ) : error ? (
            <p className="text-sm text-rose-400 px-1">{error}</p>
          ) : data && (
            <>
              {/* Risk score banner */}
              <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: rs.bg, border: `1px solid ${rs.border}` }}>
                <RiskIcon className="w-7 h-7 shrink-0" style={{ color: rs.color }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: rs.color }}>Risk Score</p>
                    <p className="text-lg font-black tabular-nums" style={{ color: rs.color }}>{data.riskScore}/100</p>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden mt-1" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${data.riskScore}%`, background: rs.color }} />
                  </div>
                  <p className="text-[11px] mt-1.5 italic" style={{ color: rs.color }}>{data.summary}</p>
                </div>
              </div>

              {/* Income sources */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-200/80 mb-1.5">Income Sources</p>
                <div className="grid grid-cols-2 gap-2">
                  <SourceRow icon={Coins} label="Deposits" value={data.income.deposits} color="#34d399" />
                  <SourceRow icon={Users} label="Referral" value={data.income.referral} color="#60a5fa" />
                  <SourceRow icon={Gift} label="Bonuses" value={data.income.bonuses} color="#facc15" />
                  <SourceRow icon={TrendingDown} label="Adjustments" value={data.income.adjustments} color="#cbd5e1" />
                </div>
                <div className="mt-2 rounded-lg p-2.5 flex items-center justify-between" style={{ background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.3)' }}>
                  <span className="text-xs font-bold text-amber-200">Total Funded</span>
                  <span className="text-sm font-black tabular-nums text-amber-100">{fmt(data.income.total)}</span>
                </div>
              </div>

              {/* Gaming behavior */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-200/80 mb-1.5">Gaming Behavior</p>
                <div className="grid grid-cols-3 gap-2">
                  <StatBox label="Rounds" value={data.gaming.rounds} />
                  <StatBox label="Win Rate" value={`${data.gaming.winRate}%`} />
                  <StatBox label="Net P/L" value={fmt(data.gaming.netProfit)} color={data.gaming.netProfit >= 0 ? '#34d399' : '#f87171'} />
                  <StatBox label="Total Bet" value={fmt(data.gaming.totalBet)} />
                  <StatBox label="Total Win" value={fmt(data.gaming.totalWin)} />
                  <StatBox label="Biggest Win" value={fmt(data.gaming.biggestWin)} />
                  <StatBox label="Avg Bet" value={fmt(data.gaming.avgBet)} />
                  <StatBox label="Max Bet" value={fmt(data.gaming.maxBet)} />
                  <StatBox label="Avg Mult" value={`${data.gaming.avgMultiplier}x`} />
                </div>
              </div>

              {/* Per-game breakdown */}
              {data.gaming.gamesPlayed.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-200/80 mb-1.5">Per-Game Breakdown</p>
                  <div className="flex flex-col gap-1.5">
                    {data.gaming.gamesPlayed.map(g => (
                      <div key={g.game} className="rounded-lg p-2 flex items-center justify-between gap-2" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.2)' }}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Gamepad2 className="w-3.5 h-3.5 text-amber-300/70 shrink-0" />
                          <span className="text-xs font-bold text-amber-100/90 truncate">{g.game}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] shrink-0">
                          <span className="text-amber-100/60">{g.rounds}r</span>
                          <span className="text-amber-100/60">{g.winRate}%</span>
                          <span className="font-bold tabular-nums" style={{ color: g.net >= 0 ? '#34d399' : '#f87171' }}>{g.net >= 0 ? '+' : ''}{fmt(g.net)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk flags */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-200/80 mb-1.5">
                  Suspicious Activity {data.flags.length > 0 && `(${data.flags.length})`}
                </p>
                {data.flags.length === 0 ? (
                  <div className="rounded-lg p-2.5 flex items-center gap-2" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)' }}>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-emerald-300">No suspicious patterns detected.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {data.flags.map((f, i) => {
                      const ls = LEVEL_STYLE[f.level];
                      return (
                        <div key={i} className="rounded-lg p-2.5 flex items-start gap-2" style={{ background: ls.bg, border: `1px solid ${ls.border}` }}>
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: ls.color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold" style={{ color: ls.color }}>{f.label}</p>
                            <p className="text-[11px] text-amber-100/60 mt-0.5">{f.detail}</p>
                          </div>
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0" style={{ color: ls.color, background: ls.bg, border: `1px solid ${ls.border}` }}>{f.level}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </WesternFrame>
      </div>
    </div>
  );
}

function SourceRow({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-lg p-2 flex items-center gap-2" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.2)' }}>
      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-amber-100/50 uppercase tracking-wide">{label}</p>
        <p className="text-xs font-bold tabular-nums" style={{ color }}>{fmt(value)}</p>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.2)' }}>
      <p className="text-[9px] text-amber-100/50 uppercase tracking-wide">{label}</p>
      <p className="text-xs font-bold tabular-nums mt-0.5" style={{ color: color || '#fff' }}>{value}</p>
    </div>
  );
}