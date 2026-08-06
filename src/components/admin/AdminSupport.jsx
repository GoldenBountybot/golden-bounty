import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, Headphones, ArrowLeft, Search, Bot, Plug, Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

// Derive agent status for a single user's thread from its control messages.
function threadStatus(msgs) {
  const controls = msgs
    .filter((m) => m.kind && m.kind !== 'message')
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  if (controls.length === 0) return 'none';
  const latest = controls[0].kind;
  if (latest === 'agent_request') return 'requested';
  if (latest === 'agent_connected') return 'connected';
  if (latest === 'agent_ended') return 'none';
  return 'none';
}

// Admin support inbox: lists all user conversations on the left, opens a
// selected user's thread on the right to read and reply. Shows agent
// requests prominently and lets the admin connect to take over a thread.
export default function AdminSupport() {
  const [allMsgs, setAllMsgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [search, setSearch] = useState('');
  const scrollRef = useRef(null);

  const loadAll = useCallback(async () => {
    try {
      const rows = await base44.entities.SupportMessage.filter({}, 'created_date', 500);
      setAllMsgs(rows);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    const unsub = base44.entities.SupportMessage.subscribe(() => { loadAll(); });
    return unsub;
  }, [loadAll]);

  // Group messages by user_id, compute last message + status per user
  const conversations = React.useMemo(() => {
    const map = new Map();
    for (const m of allMsgs) {
      const userMsgs = map.get(m.user_id) || [];
      userMsgs.push(m);
      map.set(m.user_id, userMsgs);
    }
    const list = [];
    for (const [user_id, msgs] of map.entries()) {
      const sorted = msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      const last = sorted[sorted.length - 1];
      const status = threadStatus(sorted);
      const lastReal = [...sorted].reverse().find((m) => m.kind === 'message' || !m.kind);
      list.push({
        user_id,
        user_email: last?.user_email || '',
        lastText: lastReal?.text || last?.text || '',
        lastDate: last?.created_date,
        lastSender: last?.sender,
        status,
      });
    }
    list.sort((a, b) => {
      // Agent requests float to the top
      if (a.status === 'requested' && b.status !== 'requested') return -1;
      if (b.status === 'requested' && a.status !== 'requested') return 1;
      return new Date(b.lastDate) - new Date(a.lastDate);
    });
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return list.filter(c => c.user_email.toLowerCase().includes(q) || c.user_id.includes(q));
    }
    return list;
  }, [allMsgs, search]);

  const thread = selectedUser
    ? allMsgs.filter(m => m.user_id === selectedUser).sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    : [];

  const selectedStatus = selectedUser
    ? threadStatus(allMsgs.filter(m => m.user_id === selectedUser))
    : 'none';

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [thread.length]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || !selectedUser || sending) return;
    setSending(true);
    try {
      const conv = conversations.find(c => c.user_id === selectedUser);
      await base44.entities.SupportMessage.create({
        user_id: selectedUser,
        user_email: conv?.user_email || '',
        sender: 'admin',
        text: trimmed,
        kind: 'message',
      });
      setText('');
      await loadAll();
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  };

  const connectAgent = async () => {
    if (!selectedUser || connecting) return;
    setConnecting(true);
    try {
      const conv = conversations.find(c => c.user_id === selectedUser);
      await base44.entities.SupportMessage.create({
        user_id: selectedUser,
        user_email: conv?.user_email || '',
        sender: 'admin',
        text: '🔔 Agent connected — you are now chatting with a live agent.',
        kind: 'agent_connected',
      });
      await loadAll();
    } catch { /* ignore */ } finally {
      setConnecting(false);
    }
  };

  const endAgent = async () => {
    if (!selectedUser) return;
    try {
      const conv = conversations.find(c => c.user_id === selectedUser);
      await base44.entities.SupportMessage.create({
        user_id: selectedUser,
        user_email: conv?.user_email || '',
        sender: 'admin',
        text: '🔔 Agent ended the session.',
        kind: 'agent_ended',
      });
      await loadAll();
    } catch { /* ignore */ }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#D4AF37' }} />
      </div>
    );
  }

  const pendingCount = conversations.filter(c => c.status === 'requested').length;

  return (
    <div style={{ fontFamily: SANS }}>
      {pendingCount > 0 && (
        <div className="mb-3 px-4 py-2.5 rounded-xl flex items-center gap-2 text-[12px] font-semibold"
          style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.4)', color: '#fb923c' }}>
          <Bell className="w-4 h-4" /> {pendingCount} user{pendingCount > 1 ? 's' : ''} waiting to connect with an agent.
        </div>
      )}
      <div className="grid gap-3" style={{ gridTemplateColumns: '1fr' }}>
        {/* Desktop: two-column layout */}
        <div className="hidden lg:grid gap-3" style={{ gridTemplateColumns: '320px 1fr' }}>
          <ConversationList
            conversations={conversations}
            selectedUser={selectedUser}
            onSelect={setSelectedUser}
            search={search}
            setSearch={setSearch}
          />
          {selectedUser ? (
            <ChatThread
              thread={thread}
              text={text}
              setText={setText}
              onKey={onKey}
              send={send}
              sending={sending}
              scrollRef={scrollRef}
              email={conversations.find(c => c.user_id === selectedUser)?.user_email || ''}
              status={selectedStatus}
              connecting={connecting}
              onConnect={connectAgent}
              onEnd={endAgent}
            />
          ) : (
            <EmptyThread />
          )}
        </div>

        {/* Mobile: single panel */}
        <div className="lg:hidden">
          {selectedUser ? (
            <div className="flex flex-col gap-3">
              <button onClick={() => setSelectedUser(null)}
                className="flex items-center gap-1.5 text-sm font-bold" style={{ color: '#D4AF37' }}>
                <ArrowLeft className="w-4 h-4" /> Back to conversations
              </button>
              <ChatThread
                thread={thread}
                text={text}
                setText={setText}
                onKey={onKey}
                send={send}
                sending={sending}
                scrollRef={scrollRef}
                email={conversations.find(c => c.user_id === selectedUser)?.user_email || ''}
                status={selectedStatus}
                connecting={connecting}
                onConnect={connectAgent}
                onEnd={endAgent}
              />
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              selectedUser={selectedUser}
              onSelect={setSelectedUser}
              search={search}
              setSearch={setSearch}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationList({ conversations, selectedUser, onSelect, search, setSearch }) {
  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(13,13,13,0.5)' }}>
      <div className="p-3" style={{ borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <Search className="w-4 h-4" style={{ color: 'rgba(212,175,55,0.6)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email..."
            className="flex-1 bg-transparent outline-none text-[13px]"
            style={{ color: '#fff' }}
          />
        </div>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 460 }}>
        {conversations.length === 0 ? (
          <p className="text-[12px] text-center py-8" style={{ color: 'rgba(255,255,255,0.4)' }}>No conversations yet.</p>
        ) : conversations.map((c) => (
          <button
            key={c.user_id}
            onClick={() => onSelect(c.user_id)}
            className="w-full text-left px-4 py-3 transition-colors hover:bg-white/5 relative"
            style={{
              borderBottom: '1px solid rgba(212,175,55,0.1)',
              background: selectedUser === c.user_id ? 'rgba(212,175,55,0.08)' : c.status === 'requested' ? 'rgba(251,146,60,0.06)' : 'transparent',
            }}
          >
            {c.status === 'requested' && (
              <span className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(251,146,60,0.2)', border: '1px solid rgba(251,146,60,0.5)', color: '#fb923c' }}>
                <Bell className="w-2.5 h-2.5" /> AGENT
              </span>
            )}
            {c.status === 'connected' && (
              <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.45)', color: '#34d399' }}>
                LIVE
              </span>
            )}
            <div className="flex items-center justify-between gap-2 pr-16">
              <p className="text-[13px] font-bold truncate" style={{ color: '#fff' }}>{c.user_email || c.user_id.slice(0, 8)}</p>
              <span className="text-[10px] shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {c.lastDate ? new Date(c.lastDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
              </span>
            </div>
            <p className="text-[11px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {c.lastSender === 'admin' ? 'You: ' : c.lastSender === 'bot' ? 'Bot: ' : ''}{c.lastText}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatThread({ thread, text, setText, onKey, send, sending, scrollRef, email, status, connecting, onConnect, onEnd }) {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(13,13,13,0.5)' }}>
      <div className="flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: '1px solid rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.06)' }}>
        <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ background: 'linear-gradient(135deg, #FFD700, #C89B3C)' }}>
          <Headphones className="w-4 h-4" style={{ color: '#1a1408' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: '#D4AF37' }}>{email || 'User'}</p>
          <p className="text-[10px]" style={{ color: status === 'requested' ? '#fb923c' : status === 'connected' ? '#34d399' : 'rgba(255,255,255,0.4)' }}>
            {status === 'requested' ? 'Waiting for agent' : status === 'connected' ? 'Connected' : 'Bot mode'}
          </p>
        </div>
        {status === 'connected' && (
          <button onClick={onEnd} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171' }}>
            End
          </button>
        )}
      </div>
      <div ref={scrollRef} className="flex flex-col gap-2.5 px-4 py-4 overflow-y-auto" style={{ minHeight: 280, maxHeight: 360, background: 'rgba(0,0,0,0.2)' }}>
        {thread.length === 0 ? (
          <p className="text-[12px] text-center py-8" style={{ color: 'rgba(255,255,255,0.4)' }}>No messages in this thread.</p>
        ) : thread.map((m) => {
          if (m.kind && m.kind !== 'message') {
            return (
              <div key={m.id} className="flex justify-center">
                <span className="text-[10px] px-3 py-1 rounded-full" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: 'rgba(212,175,55,0.85)' }}>
                  {m.text}
                </span>
              </div>
            );
          }
          const isAdmin = m.sender === 'admin';
          const isBot = m.sender === 'bot';
          return (
            <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[78%] px-3.5 py-2 rounded-2xl"
                style={{
                  background: isAdmin ? 'linear-gradient(135deg, #FFD700, #C89B3C)' : isBot ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(79,70,229,0.18))' : 'rgba(255,255,255,0.06)',
                  border: isAdmin ? 'none' : isBot ? '1px solid rgba(129,140,248,0.4)' : '1px solid rgba(212,175,55,0.25)',
                  color: isAdmin ? '#1a1408' : '#fff',
                  borderBottomRightRadius: isAdmin ? 6 : 14,
                  borderBottomLeftRadius: isAdmin ? 14 : 6,
                }}
              >
                {isBot && (
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1" style={{ color: '#a5b4fc' }}>
                    <Bot className="w-2.5 h-2.5" /> Bounty Bot
                  </p>
                )}
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
                <p className="text-[9px] mt-1 text-right" style={{ color: isAdmin ? 'rgba(26,20,8,0.6)' : 'rgba(255,255,255,0.35)' }}>
                  {m.created_date ? new Date(m.created_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent connect bar */}
      {status === 'requested' && (
        <div className="px-3 pt-3" style={{ borderTop: '1px solid rgba(212,175,55,0.2)' }}>
          <button
            onClick={onConnect}
            disabled={connecting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', color: '#04130d', boxShadow: '0 4px 14px rgba(52,211,153,0.35)' }}
          >
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />} {connecting ? 'Connecting…' : 'Connect & Take Over'}
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-3" style={{ borderTop: '1px solid rgba(212,175,55,0.2)' }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder={status === 'connected' ? 'Reply to user…' : status === 'requested' ? 'Connect first to reply…' : 'Reply (will connect you)…'}
          disabled={sending || status === 'requested'}
          className="flex-1 px-4 py-2.5 rounded-xl text-[13px] outline-none disabled:opacity-50"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.25)', color: '#fff' }}
        />
        <button
          onClick={send}
          disabled={sending || !text.trim() || status === 'requested'}
          className="flex items-center justify-center w-11 h-11 rounded-xl transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #FFD700, #C89B3C)', boxShadow: '0 4px 14px rgba(212,175,55,0.35)' }}
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#1a1408' }} /> : <Send className="w-5 h-5" style={{ color: '#1a1408' }} />}
        </button>
      </div>
    </div>
  );
}

function EmptyThread() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl gap-3" style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(13,13,13,0.5)', minHeight: 420 }}>
      <Headphones className="w-10 h-10" style={{ color: 'rgba(212,175,55,0.4)' }} />
      <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Select a conversation to view messages</p>
    </div>
  );
}