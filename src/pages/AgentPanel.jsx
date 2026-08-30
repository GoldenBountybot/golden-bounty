import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Wallet } from 'lucide-react';
import BackButton from '@/components/BackButton';
import AgentTransferForm from '@/components/agent/AgentTransferForm';
import AgentTransferHistory from '@/components/agent/AgentTransferHistory';
import { agentOps } from '@/lib/agentApi';
import { base44 } from '@/api/base44Client';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, sans-serif";

export default function AgentPanel() {
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    agentOps('me').then(r => {
      if (r.role !== 'agent' && r.role !== 'admin') { navigate('/', { replace: true }); return; }
      setInfo(r);
    });
  }, [key, navigate]);

  // Live update: a player withdrawal creates a notification for this agent —
  // refresh balance + transfer history the moment it arrives.
  useEffect(() => {
    let unsub = null;
    try {
      unsub = base44.entities.UserNotification.subscribe?.((event) => {
        if (event?.type === 'create') setKey(k => k + 1);
      });
    } catch { /* realtime unavailable */ }
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0D0D0D', fontFamily: SANS }}>
      <header className="sticky top-0 z-20 backdrop-blur-xl" style={{ background: 'rgba(13,13,13,0.78)', borderBottom: '1px solid rgba(212,175,55,0.22)' }}>
        <div className="max-w-none mx-auto px-4 py-3 flex items-center gap-3">
          <BackButton />
          <div className="flex-1 flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5" style={{ color: '#D4AF37' }} />
            <span className="text-lg font-extrabold" style={{ color: '#D4AF37' }}>Agent Panel</span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-none mx-auto px-4 py-4 flex flex-col gap-4">
        <div className="dash-card p-5" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(255,255,255,0.03))' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(212,175,55,0.85)' }}>Agent Balance</p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums" style={{ color: '#fff' }}>
                ${Number(info?.balance ?? 0).toFixed(2)}
              </p>
              <p className="mt-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {info?.username ? `@${info.username}` : ''} {info?.uid ? `· ID ${info.uid}` : ''}
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: 'linear-gradient(135deg,#FFD700,#C89B3C)' }}>
              <Wallet className="w-6 h-6" style={{ color: '#1a1408' }} />
            </div>
          </div>
        </div>

        <AgentTransferForm onDone={() => setKey(k => k + 1)} />
        <AgentTransferHistory refreshKey={key} />
      </main>
    </div>
  );
}