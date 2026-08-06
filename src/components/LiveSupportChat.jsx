import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, Headphones, UserRound, Plug, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { getBotReply } from '@/lib/supportBot';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";
const BOT_LOGO = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c39869f00_file_000000003b6c821193c37e7c968d77f2.png';

// Derive the current agent status from the thread's control messages.
// "none"  -> bot mode (AI auto-replies)
// "requested" -> user asked for an agent, waiting for admin
// "connected" -> admin joined, direct chat
function deriveAgentStatus(messages) {
  const controls = messages
    .filter((m) => m.kind && m.kind !== 'message')
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  if (controls.length === 0) return 'none';
  const latest = controls[0].kind;
  if (latest === 'agent_request') return 'requested';
  if (latest === 'agent_connected') return 'connected';
  if (latest === 'agent_ended') return 'none';
  return 'none';
}

// Live support chat: starts in BOT mode (AI auto-replies about the site).
// User can tap "Connect with Agent" to request a human; admin connects and
// the thread switches to direct chat. Real-time subscription keeps it live.
export default function LiveSupportChat() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [botTyping, setBotTyping] = useState(false);
  const [agentStatus, setAgentStatus] = useState('none');
  const scrollRef = useRef(null);

  const loadMessages = useCallback(async () => {
    if (!user?.id) return;
    try {
      const rows = await base44.entities.SupportMessage.filter(
        { user_id: user.id }, 'created_date', 200
      );
      setMessages(rows);
      setAgentStatus(deriveAgentStatus(rows));
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadMessages();
    const unsub = base44.entities.SupportMessage.subscribe(() => { loadMessages(); });
    return unsub;
  }, [loadMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, botTyping]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user?.id || sending) return;
    setSending(true);
    setText('');
    try {
      await base44.entities.SupportMessage.create({
        user_id: user.id,
        user_email: user.email || '',
        sender: 'user',
        text: trimmed,
        kind: 'message',
      });
      await loadMessages();

      // Bot mode: get an AI reply. Agent mode: messages go straight to admin.
      if (agentStatus === 'none') {
        setBotTyping(true);
        try {
          const { reply, wantsAgent } = await getBotReply(trimmed, messages);
          if (reply) {
            await base44.entities.SupportMessage.create({
              user_id: user.id,
              user_email: user.email || '',
              sender: 'bot',
              text: reply,
              kind: 'message',
              show_agent_button: wantsAgent && agentStatus === 'none',
            });
          }
        } finally {
          setBotTyping(false);
        }
        await loadMessages();
      }
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  };

  const requestAgent = async () => {
    if (!user?.id || agentStatus !== 'none') return;
    try {
      await base44.entities.SupportMessage.create({
        user_id: user.id,
        user_email: user.email || '',
        sender: 'user',
        text: '🔔 Requesting to connect with a live agent…',
        kind: 'agent_request',
      });
      await loadMessages();
    } catch { /* ignore */ }
  };

  const endAgent = async () => {
    if (!user?.id || agentStatus !== 'connected') return;
    try {
      await base44.entities.SupportMessage.create({
        user_id: user.id,
        user_email: user.email || '',
        sender: 'user',
        text: '🔔 Ended the agent chat — back to Bounty Bot.',
        kind: 'agent_ended',
      });
      await loadMessages();
    } catch { /* ignore */ }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const isBotMode = agentStatus === 'none';
  const isWaiting = agentStatus === 'requested';
  const isConnected = agentStatus === 'connected';

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: SANS, animation: 'dashFadeIn 400ms ease both' }}>
      {/* Chat header */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-t-2xl shrink-0"
        style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(255,255,255,0.03))', border: '1px solid rgba(212,175,55,0.35)', borderBottom: 'none' }}>
        <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 overflow-hidden"
          style={{ background: isBotMode ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'linear-gradient(135deg, #FFD700, #C89B3C)', boxShadow: '0 0 10px rgba(212,175,55,0.3)' }}>
          {isBotMode
            ? <img src={BOT_LOGO} alt="Bounty Bot" className="w-full h-full object-cover" />
            : <Headphones className="w-4 h-4" style={{ color: '#1a1408' }} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: '#D4AF37' }}>
            {isBotMode ? 'Bounty Bot' : isWaiting ? t('Connecting…') : t('Live Agent')}
          </p>
          <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {isBotMode ? t('AI assistant · auto-replies about the site') : isWaiting ? t('Waiting for an agent to join') : t('You are connected with a live agent')}
          </p>
        </div>
        <span className="flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full" style={{ background: isBotMode ? '#818cf8' : '#34d399', boxShadow: `0 0 6px ${isBotMode ? 'rgba(129,140,248,0.7)' : 'rgba(52,211,153,0.7)'}` }} />
          <span className="text-[10px] font-semibold" style={{ color: isBotMode ? '#818cf8' : '#34d399' }}>
            {isBotMode ? 'AI' : isWaiting ? t('Connecting') : t('Online')}
          </span>
        </span>
      </div>

      {/* Messages area — fills available height up to the header */}
      <div ref={scrollRef}
        className="flex flex-col gap-2.5 px-4 py-4 overflow-y-auto flex-1"
        style={{
          border: '1px solid rgba(212,175,55,0.35)',
          borderTop: 'none',
          background: 'rgba(13,13,13,0.4)',
          minHeight: 0,
        }}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#D4AF37' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <img src={BOT_LOGO} alt="Bounty Bot" className="w-14 h-14 rounded-full object-cover" style={{ boxShadow: '0 0 14px rgba(99,102,241,0.4)', border: '2px solid rgba(129,140,248,0.5)' }} />
            <p className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('Hi! I\'m Bounty Bot 🤖')}</p>
            <p className="text-[11px] max-w-[260px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{t('Ask me anything about games, deposits, withdrawals, VIP, or referrals. Want a human? Just ask me to connect you with an agent.')}</p>
          </div>
        ) : (
          <>
            {messages.map((m) => {
              if (m.kind && m.kind !== 'message') {
                return (
                  <div key={m.id} className="flex justify-center">
                    <span className="text-[10px] px-3 py-1 rounded-full" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: 'rgba(212,175,55,0.85)' }}>
                      {m.text}
                    </span>
                  </div>
                );
              }
              const isUser = m.sender === 'user';
              const isBot = m.sender === 'bot';
              return (
                <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${m.show_agent_button && isBotMode ? 'flex-col items-start' : ''}`}>
                  <div
                    className="max-w-[80%] px-3.5 py-2 rounded-2xl"
                    style={{
                      background: isUser
                        ? 'linear-gradient(135deg, #FFD700, #C89B3C)'
                        : isBot
                        ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(79,70,229,0.18))'
                        : 'rgba(255,255,255,0.06)',
                      border: isUser ? 'none' : isBot ? '1px solid rgba(129,140,248,0.4)' : '1px solid rgba(212,175,55,0.25)',
                      color: isUser ? '#1a1408' : '#fff',
                      borderBottomRightRadius: isUser ? 6 : 14,
                      borderBottomLeftRadius: isUser ? 14 : 6,
                    }}
                  >
                    {isBot && (
                      <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1" style={{ color: '#a5b4fc' }}>
                        <img src={BOT_LOGO} alt="" className="w-3 h-3 rounded-full object-cover" /> Bounty Bot
                      </p>
                    )}
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
                    <p className="text-[9px] mt-1 text-right" style={{ color: isUser ? 'rgba(26,20,8,0.6)' : 'rgba(255,255,255,0.35)' }}>
                      {m.created_date ? new Date(m.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                  {m.show_agent_button && isBotMode && (
                    <button
                      onClick={requestAgent}
                      className="mt-1.5 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95"
                      style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(129,140,248,0.45)', color: '#a5b4fc' }}
                    >
                      <Plug className="w-3 h-3" /> {t('Connect with Agent')}
                    </button>
                  )}
                </div>
              );
            })}
            {botTyping && (
              <div className="flex justify-start">
                <div className="px-3.5 py-2.5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(79,70,229,0.18))', border: '1px solid rgba(129,140,248,0.4)' }}>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#a5b4fc', animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#a5b4fc', animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#a5b4fc', animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action bar + input area */}
      <div className="rounded-b-2xl shrink-0" style={{ border: '1px solid rgba(212,175,55,0.35)', borderTop: 'none', background: 'rgba(13,13,13,0.6)' }}>
        {/* Agent status bar — only shown when waiting or connected, not in bot mode */}
        {isWaiting && (
          <div className="px-3 pt-3">
            <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold" style={{ background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.4)', color: '#fb923c' }}>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('Connecting you to an agent…')}
            </div>
          </div>
        )}
        {isConnected && (
          <div className="px-3 pt-3 flex items-center gap-2">
            <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold" style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399' }}>
              <UserRound className="w-3.5 h-3.5" /> {t('Connected to live agent')}
            </div>
            <button
              onClick={endAgent}
              className="flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95 shrink-0"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171' }}
              title={t('End agent chat')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2 px-3 py-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            placeholder={isBotMode ? t('Ask Bounty Bot…') : t('Type a message...')}
            disabled={sending || botTyping}
            className="flex-1 px-4 py-2.5 rounded-xl text-[13px] outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(212,175,55,0.25)',
              color: '#fff',
            }}
          />
          <button
            onClick={send}
            disabled={sending || botTyping || !text.trim()}
            className="flex items-center justify-center w-11 h-11 rounded-xl transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #FFD700, #C89B3C)',
              boxShadow: '0 4px 14px rgba(212,175,55,0.35)',
            }}
          >
            {sending || botTyping ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#1a1408' }} /> : <Send className="w-5 h-5" style={{ color: '#1a1408' }} />}
          </button>
        </div>
      </div>
    </div>
  );
}