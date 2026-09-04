import React, { useState, useEffect } from 'react';
import { UserCheck, UserMinus, Search } from 'lucide-react';
import { agentOps, agentError } from '@/lib/agentApi';
import AgentTransferForm from '@/components/agent/AgentTransferForm';
import AgentTransferHistory from '@/components/agent/AgentTransferHistory';
import { AGENT_COUNTRIES, countryFlag } from '@/lib/agentCountries';
import { listAgentProfiles, saveAgentProfile, removeAgentProfile } from '@/lib/agentProfiles';

export default function AdminAgents() {
  const [q, setQ] = useState('');
  const [found, setFound] = useState(null);
  const [msg, setMsg] = useState(null);
  const [agents, setAgents] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [countryCode, setCountryCode] = useState('BD');
  const [key, setKey] = useState(0);

  const loadAgents = () => Promise.all([
    agentOps('agents').then(r => setAgents(r.agents || [])),
    listAgentProfiles().then(setProfiles),
  ]);
  useEffect(() => { loadAgents(); }, [key]);

  const profileOf = (id) => profiles.find(p => p.agent_user_id === id);

  const search = async () => {
    setMsg(null); setFound(null);
    const res = await agentOps('lookup', { q: q.trim() });
    if (res.error) { setMsg(agentError(res)); return; }
    setFound(res.user);
  };

  const makeAgent = async (user) => {
    const res = await agentOps('set_role', { q: user.id, role: 'agent' });
    if (!res.ok) { setMsg(agentError(res)); return; }
    const country = AGENT_COUNTRIES.find(c => c.code === countryCode);
    await saveAgentProfile({ ...user, ...res.user }, country);
    setFound(res.user);
    setMsg(`${res.user.username} is now an agent (${country?.flag} ${country?.name}).`);
    setKey(k => k + 1);
  };

  const removeAgent = async (user) => {
    const res = await agentOps('set_role', { q: user.id, role: 'user' });
    if (!res.ok) { setMsg(agentError(res)); return; }
    await removeAgentProfile(user.id);
    if (found?.id === user.id) setFound(res.user);
    setMsg(`${res.user.username} is a player again.`);
    setKey(k => k + 1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="dash-card p-4 flex flex-col gap-3">
        <h3 className="text-sm font-bold" style={{ color: '#D4AF37' }}>Make Someone an Agent</h3>
        <div className="flex items-center gap-2">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Username, ID or email"
            className="dash-input flex-1 px-3 py-2.5 text-sm" />
          <button onClick={search} className="dash-btn-gold px-4 py-2.5 text-sm flex items-center gap-1">
            <Search className="w-4 h-4" /> Find
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] shrink-0" style={{ color: 'rgba(255,255,255,0.6)' }}>Country tag</label>
          <select value={countryCode} onChange={e => setCountryCode(e.target.value)} className="dash-input flex-1 px-3 py-2.5 text-sm">
            {AGENT_COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            ))}
          </select>
        </div>
        {found && (
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.25)' }}>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold truncate" style={{ color: '#fff' }}>{found.username}</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>ID: {found.uid || found.id.slice(0, 8)} · role: {found.role}</p>
            </div>
            {found.role === 'agent' ? (
              <button onClick={() => removeAgent(found)} className="px-3 py-2 rounded-lg text-[12px] font-bold flex items-center gap-1"
                style={{ border: '1px solid rgba(248,113,113,0.5)', background: 'rgba(248,113,113,0.12)', color: '#f87171' }}>
                <UserMinus className="w-4 h-4" /> Remove
              </button>
            ) : (
              <button onClick={() => makeAgent(found)} className="dash-btn-gold px-3 py-2 text-[12px] flex items-center gap-1">
                <UserCheck className="w-4 h-4" /> Make Agent
              </button>
            )}
          </div>
        )}
        {msg && <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{msg}</p>}
      </div>

      <AgentTransferForm onDone={() => setKey(k => k + 1)} />

      <div className="dash-card p-4 flex flex-col gap-2">
        <h3 className="text-sm font-bold" style={{ color: '#D4AF37' }}>Agents ({agents.length})</h3>
        {agents.length === 0 && <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>No agents yet.</p>}
        {agents.map(a => {
          const p = profileOf(a.id);
          return (
            <div key={a.id} className="flex items-center gap-2 py-2" style={{ borderTop: '1px solid rgba(212,175,55,0.14)' }}>
              <span className="text-base shrink-0" title={p?.country_name || 'No country tag'}>{countryFlag(p?.country_code)}</span>
              <span className="flex-1 text-[13px] font-semibold truncate" style={{ color: '#fff' }}>{a.username}</span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{a.uid}</span>
              <button onClick={() => removeAgent(a)} className="px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0"
                style={{ border: '1px solid rgba(248,113,113,0.5)', background: 'rgba(248,113,113,0.12)', color: '#f87171' }}>
                <UserMinus className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          );
        })}
      </div>

      <AgentTransferHistory refreshKey={key} />
    </div>
  );
}