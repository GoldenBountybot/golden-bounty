import React, { useState, useEffect } from 'react';
import { Megaphone } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { pushNotification } from '@/lib/notify';
import WesternFrame from '@/components/wildbounty/WesternFrame';

// Admin tool to broadcast a system notice to every user (shows up in their
// notification bell with a red dot until viewed). Also lists the most recent
// broadcasts sent.
export default function AdminNotices() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const rows = await base44.entities.UserNotification.filter({ type: 'system' }, '-created_date', 20);
      setRecent(rows || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const send = async () => {
    const t = title.trim();
    if (!t) { toast({ title: 'Enter a notice title' }); return; }
    await pushNotification({ user_id: '', type: 'system', title: t, body: body.trim() });
    setTitle('');
    setBody('');
    toast({ title: 'Notice sent to all users' });
    load();
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Broadcast Notice</h2>
      <WesternFrame className="p-3 flex flex-col gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Notice title"
          className="px-2 py-2 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-sm"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Notice details (optional)"
          rows={3}
          className="px-2 py-2 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-sm resize-none"
        />
        <button
          onClick={send}
          className="self-start px-3 py-1.5 rounded-lg bg-amber-400 text-stone-900 text-sm font-bold italic flex items-center gap-1.5"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          <Megaphone className="w-4 h-4" /> Send to all users
        </button>
      </WesternFrame>

      <h2 className="font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Recent Notices</h2>
      {loading ? (
        <p className="text-amber-100/60">Loading...</p>
      ) : recent.length === 0 ? (
        <p className="text-amber-100/50 text-sm italic">No notices sent yet.</p>
      ) : recent.map((n) => (
        <WesternFrame key={n.id} className="p-2.5">
          <p className="font-bold text-amber-100 text-sm">{n.title}</p>
          {n.body && <p className="text-xs text-amber-100/60 italic mt-0.5">{n.body}</p>}
          {n.created_date && (
            <p className="text-[10px] text-amber-100/40 italic mt-1">
              {new Date(n.created_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          )}
        </WesternFrame>
      ))}
    </div>
  );
}