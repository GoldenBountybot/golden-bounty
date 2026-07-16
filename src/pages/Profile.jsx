import React, { useState, useEffect } from 'react';
import { ArrowLeft, User as UserIcon, Phone, Hash, LogOut, Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';

// Player profile: update username & mobile number, view unique uid, log out.
export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ username, phone });
      toast({ title: 'Profile updated' });
    } catch (e) {
      toast({ title: 'Update failed', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-amber-950/40 to-stone-950 pb-10">
      <header className="sticky top-0 z-20 bg-stone-950/90 backdrop-blur-xl border-b border-amber-700/30">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => { window.location.href = '/'; }} title="Back" className="flex items-center justify-center w-9 h-9 rounded-lg text-stone-300 hover:text-amber-200 hover:bg-black/40 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-base font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Profile</h1>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 flex flex-col gap-4">
        {/* Avatar + uid */}
        <WesternFrame glow className="p-5 flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-stone-950" />
          </div>
          <h2 className="text-lg font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>{user?.full_name || username || 'Player'}</h2>
          <p className="text-xs text-amber-100/70">{user?.email}</p>
          <div className="flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full bg-black/40 border border-amber-700/40">
            <Hash className="w-3 h-3 text-amber-400/70" />
            <span className="text-[11px] font-mono text-amber-100/80 select-all">{user?.id}</span>
          </div>
        </WesternFrame>

        {/* Edit fields */}
        <WesternFrame className="p-4 flex flex-col gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] tracking-widest uppercase text-amber-300/70" style={{ fontFamily: 'Georgia, serif' }}>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Set a username"
              className="w-full px-3 py-2.5 rounded-md bg-black/40 border border-amber-700/40 text-amber-100 placeholder-amber-100/40 outline-none focus:border-amber-500"
              style={{ fontFamily: 'Georgia, serif' }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] tracking-widest uppercase text-amber-300/70" style={{ fontFamily: 'Georgia, serif' }}>Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/60" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 000 0000"
                className="w-full pl-9 pr-3 py-2.5 rounded-md bg-black/40 border border-amber-700/40 text-amber-100 placeholder-amber-100/40 outline-none focus:border-amber-500"
                style={{ fontFamily: 'Georgia, serif' }}
              />
            </div>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 text-base font-black italic shadow-lg hover:from-amber-300 hover:to-orange-400 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save Changes</>}
          </button>
        </WesternFrame>

        <button
          onClick={() => logout()}
          className="w-full py-3 rounded-xl bg-black/30 border border-amber-700/40 text-amber-100/80 text-sm font-bold italic hover:bg-rose-900/40 hover:text-rose-200 transition-colors flex items-center justify-center gap-2"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>
      </main>
    </div>
  );
}