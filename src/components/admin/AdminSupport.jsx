import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Headphones, ArrowLeft, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

// Admin support inbox: lists all user conversations on the left, opens a
// selected user's thread on the right to read and reply. Real-time updates
// keep the inbox fresh as new user messages arrive.
export default function AdminSupport() {
  const [allMsgs, setAllMsgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const scrollRef = useRef(null);

  const loadAll = async () => {
    try {
      const rows = await base44.entities.SupportMessage.filter({}, 'created_date', 500);
      setAllMsgs(rows);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const unsub = base44.entities.SupportMessage.subscribe(() => { loadAll(); });
    return unsub;
  }, []);

  // Group messages by user_id, compute last message + unread count per user
  const conversations = React.useMemo(() => {
    const map = new Map();
    for (const m of allMsgs) {
      const existing = map.get(m.user_id);
      if (!existing || new Date(m.created_date) > new Date(existing.lastDate)) {
        map.set(m.user_id, {
          user_id: m.user_id,
          user_email: m.user_email || '',
          lastText: m.text,
          lastDate: m.created_date,
          lastSender: m.sender,
        });
      }
    }
    let list = Array.from(map.values()).sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c => c.user_email.toLowerCase().includes(q) || c.user_id.includes(q));
    }
    return list;
  }, [allMsgs, search]);

  const thread = selectedUser
    ? allMsgs.filter(m => m.user_id === selectedUser).sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    : [];

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
      });
      setText('');
      await loadAll();
    } catch { /* ignore */ } finally {
      setSending(false);
    }
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

  // Mobile: show either list OR thread
  // Desktop: show both side-by-side
  return (
    <div style={{ fontFamily: SANS }}>
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
            className="w-full text-left px-4 py-3 transition-colors hover:bg-white/5"
            style={{
              borderBottom: '1px solid rgba(212,175,55,0.1)',
              background: selectedUser === c.user_id ? 'rgba(212,175,55,0.08)' : 'transparent',
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-bold truncate" style={{ color: '#fff' }}>{c.user_email || c.user_id.slice(0, 8)}</p>
              <span className="text-[10px] shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {c.lastDate ? new Date(c.lastDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
              </span>
            </div>
            <p className="text-[11px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {c.lastSender === 'admin' ? 'You: ' : ''}{c.lastText}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatThread({ thread, text, setText, onKey, send, sending, scrollRef, email }) {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(13,13,13,0.5)' }}>
      <div className="flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: '1px solid rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.06)' }}>
        <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ background: 'linear-gradient(135deg, #FFD700, #C89B3C)' }}>
          <Headphones className="w-4 h-4" style={{ color: '#1a1408' }} />
        </div>
        <p className="text-sm font-bold truncate" style={{ color: '#D4AF37' }}>{email || 'User'}</p>
      </div>
      <div ref={scrollRef} className="flex flex-col gap-2.5 px-4 py-4 overflow-y-auto" style={{ minHeight: 280, maxHeight: 360, background: 'rgba(0,0,0,0.2)' }}>
        {thread.length === 0 ? (
          <p className="text-[12px] text-center py-8" style={{ color: 'rgba(255,255,255,0.4)' }}>No messages in this thread.</p>
        ) : thread.map((m) => {
          const isAdmin = m.sender === 'admin';
          return (
            <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[78%] px-3.5 py-2 rounded-2xl"
                style={{
                  background: isAdmin ? 'linear-gradient(135deg, #FFD700, #C89B3C)' : 'rgba(255,255,255,0.06)',
                  border: isAdmin ? 'none' : '1px solid rgba(212,175,55,0.25)',
                  color: isAdmin ? '#1a1408' : '#fff',
                  borderBottomRightRadius: isAdmin ? 6 : 14,
                  borderBottomLeftRadius: isAdmin ? 14 : 6,
                }}
              >
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
                <p className="text-[9px] mt-1 text-right" style={{ color: isAdmin ? 'rgba(26,20,8,0.6)' : 'rgba(255,255,255,0.35)' }}>
                  {m.created_date ? new Date(m.created_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 px-3 py-3" style={{ borderTop: '1px solid rgba(212,175,55,0.2)' }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder="Reply to user..."
          disabled={sending}
          className="flex-1 px-4 py-2.5 rounded-xl text-[13px] outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.25)', color: '#fff' }}
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
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