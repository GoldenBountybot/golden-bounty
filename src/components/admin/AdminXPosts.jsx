import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Check, X, ExternalLink, Clock, CheckCircle2, XCircle, Gift } from 'lucide-react';

const WINDOW_MS = 24 * 60 * 60 * 1000;

const XLogo = ({ className, style }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.215-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.91l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const fmtRemain = (ms) => {
  if (ms <= 0) return 'expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
};

export default function AdminXPosts() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.XPostSubmission.filter({}, '-created_date', 200);
      setSubmissions(list);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const review = async (sub, status) => {
    try {
      await base44.entities.XPostSubmission.update(sub.id, {
        status,
        reviewed_at: new Date().toISOString(),
      });
      setSubmissions((prev) => prev.map((s) => s.id === sub.id ? { ...s, status, reviewed_at: new Date().toISOString() } : s));
      toast({ title: status === 'approved' ? 'Approved' : 'Rejected' });
    } catch (e) {
      toast({ title: 'Failed', description: e.message });
    }
  };

  const pending = submissions.filter(s => s.status === 'pending');
  const reviewed = submissions.filter(s => s.status !== 'pending');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold italic" style={{ color: '#e8c878', fontFamily: 'Georgia, serif' }}>X Post Submissions</h3>
        <button onClick={load} className="text-[11px] font-bold italic px-3 py-1.5 rounded-lg" style={{ border: '1px solid rgba(214,178,98,0.4)', color: '#e8c878', fontFamily: 'Georgia, serif' }}>Refresh</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#e8c878' }} />
        </div>
      ) : (
        <>
          {/* Pending */}
          {pending.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#fb923c', fontFamily: 'Georgia, serif' }}>Pending Review ({pending.length})</p>
              {pending.map((s) => {
                const deadline = new Date(s.created_date).getTime() + WINDOW_MS;
                const remain = deadline - now;
                const expired = remain <= 0;
                return (
                  <div key={s.id} className="rounded-xl p-3 flex flex-col gap-2" style={{ background: 'rgba(20,17,13,0.6)', border: '1px solid rgba(214,178,98,0.3)' }}>
                    <div className="flex items-center gap-2">
                      <XLogo className="w-4 h-4" style={{ color: '#fff' }} />
                      <span className="text-sm font-bold" style={{ color: '#fff' }}>@{s.x_username}</span>
                      <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>· {s.user_email}</span>
                    </div>
                    <a href={s.post_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[12px] hover:underline" style={{ color: '#e8c878' }}>
                      <ExternalLink className="w-3.5 h-3.5" /> <span className="truncate">{s.post_link}</span>
                    </a>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] flex items-center gap-1" style={{ color: expired ? '#f87171' : '#fb923c' }}>
                        <Clock className="w-3 h-3" /> {expired ? 'Expired — no approval in 24h' : `${fmtRemain(remain)} left`}
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => review(s, 'approved')} disabled={expired}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold italic disabled:opacity-40"
                          style={{ background: 'linear-gradient(to bottom,#34d399,#10b981)', color: '#06281f', fontFamily: 'Georgia, serif' }}>
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button onClick={() => review(s, 'rejected')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold italic"
                          style={{ border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.1)', color: '#f87171', fontFamily: 'Georgia, serif' }}>
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reviewed history */}
          {reviewed.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'rgba(232,200,120,0.7)', fontFamily: 'Georgia, serif' }}>Reviewed ({reviewed.length})</p>
              {reviewed.map((s) => {
                const meta = s.status === 'approved'
                  ? { icon: CheckCircle2, color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.4)', label: 'Approved' }
                  : s.status === 'rejected'
                  ? { icon: XCircle, color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.4)', label: 'Rejected' }
                  : { icon: Clock, color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.4)', label: 'Expired' };
                const Icon = meta.icon;
                return (
                  <div key={s.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'rgba(20,17,13,0.4)', border: `1px solid ${meta.border}`, opacity: 0.8 }}>
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0" style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                      <Icon className="w-4 h-4" style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: '#fff' }}>@{s.x_username}</p>
                      <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.user_email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>{meta.label}</span>
                      {s.claimed && <span className="text-[10px] flex items-center gap-0.5" style={{ color: '#34d399' }}><Gift className="w-3 h-3" /> Claimed</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {submissions.length === 0 && (
            <p className="text-center text-[12px] italic py-8" style={{ color: 'rgba(232,200,120,0.5)', fontFamily: 'Georgia, serif' }}>No X post submissions yet.</p>
          )}
        </>
      )}
    </div>
  );
}