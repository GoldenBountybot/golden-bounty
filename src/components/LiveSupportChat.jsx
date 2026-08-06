import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Headphones } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

// Live support chat between a user and the admin team. Messages are stored
// in the SupportMessage entity; only the user and admins can read them.
// Real-time subscription keeps the thread live as the admin replies.
export default function LiveSupportChat() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const loadMessages = async () => {
    if (!user?.id) return;
    try {
      const rows = await base44.entities.SupportMessage.filter(
        { user_id: user.id }, 'created_date', 200
      );
      setMessages(rows);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    // Real-time: refresh whenever a new message arrives
    const unsub = base44.entities.SupportMessage.subscribe(() => {
      loadMessages();
    });
    return unsub;
  }, [user?.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user?.id || sending) return;
    setSending(true);
    try {
      await base44.entities.SupportMessage.create({
        user_id: user.id,
        user_email: user.email || '',
        sender: 'user',
        text: trimmed,
      });
      setText('');
      await loadMessages();
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col" style={{ fontFamily: SANS, animation: 'dashFadeIn 400ms ease both' }}>
      {/* Chat header */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-t-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(255,255,255,0.03))', border: '1px solid rgba(212,175,55,0.35)', borderBottom: 'none' }}>
        <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
          style={{ background: 'linear-gradient(135deg, #FFD700, #C89B3C)', boxShadow: '0 0 10px rgba(212,175,55,0.3)' }}>
          <Headphones className="w-4 h-4" style={{ color: '#1a1408' }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: '#D4AF37' }}>{t('Live Support')}</p>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{t('We typically reply within a few minutes')}</p>
        </div>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: '#34d399', boxShadow: '0 0 6px rgba(52,211,153,0.7)' }} />
          <span className="text-[10px] font-semibold" style={{ color: '#34d399' }}>{t('Online')}</span>
        </span>
      </div>

      {/* Messages area */}
      <div ref={scrollRef}
        className="flex flex-col gap-2.5 px-4 py-4 overflow-y-auto"
        style={{
          border: '1px solid rgba(212,175,55,0.35)',
          borderTop: 'none',
          background: 'rgba(13,13,13,0.4)',
          minHeight: 280,
          maxHeight: 380,
        }}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#D4AF37' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <Headphones className="w-8 h-8" style={{ color: 'rgba(212,175,55,0.5)' }} />
            <p className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>{t('No messages yet')}</p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{t('Send a message below to start a conversation with our support team.')}</p>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[78%] px-3.5 py-2 rounded-2xl"
                  style={{
                    background: isUser
                      ? 'linear-gradient(135deg, #FFD700, #C89B3C)'
                      : 'rgba(255,255,255,0.06)',
                    border: isUser ? 'none' : '1px solid rgba(212,175,55,0.25)',
                    color: isUser ? '#1a1408' : '#fff',
                    borderBottomRightRadius: isUser ? 6 : 14,
                    borderBottomLeftRadius: isUser ? 14 : 6,
                  }}
                >
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
                  <p className="text-[9px] mt-1 text-right" style={{ color: isUser ? 'rgba(26,20,8,0.6)' : 'rgba(255,255,255,0.35)' }}>
                    {m.created_date ? new Date(m.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input area */}
      <div className="flex items-center gap-2 px-3 py-3 rounded-b-2xl"
        style={{ border: '1px solid rgba(212,175,55,0.35)', borderTop: 'none', background: 'rgba(13,13,13,0.6)' }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder={t('Type a message...')}
          disabled={sending}
          className="flex-1 px-4 py-2.5 rounded-xl text-[13px] outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(212,175,55,0.25)',
            color: '#fff',
          }}
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="flex items-center justify-center w-11 h-11 rounded-xl transition-all active:scale-95 disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, #FFD700, #C89B3C)',
            boxShadow: '0 4px 14px rgba(212,175,55,0.35)',
          }}
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#1a1408' }} /> : <Send className="w-5 h-5" style={{ color: '#1a1408' }} />}
        </button>
      </div>
    </div>
  );
}