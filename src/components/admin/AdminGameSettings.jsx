import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import GameRtpCard from '@/components/admin/GameRtpCard';

export default function AdminGameSettings() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.GameSetting.list();
      // Sort locally so the order NEVER changes after a save (server ordering
      // by updated_date used to reshuffle the cards, which looked like one
      // game's RTP jumping when another was lowered).
      list.sort((a, b) => {
        if (a.game_id === '*') return -1;
        if (b.game_id === '*') return 1;
        return String(a.game_id).localeCompare(String(b.game_id));
      });
      setRows(list);
    } catch { toast({ title: 'Failed to load' }); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (r) => {
    try {
      // Update strictly by this record's own id, with only its own values.
      const updated = await base44.entities.GameSetting.update(r.id, {
        rtp: Number(r.rtp),
        demo_rtp: Number(r.demo_rtp ?? 50),
        enabled: !!r.enabled,
        min_bet: Number(r.min_bet),
        max_bet: Number(r.max_bet),
      });
      setRows(rs => rs.map(x => (x.id === r.id ? { ...x, ...(updated || r) } : x)));
      toast({ title: `${r.game_id === '*' ? 'Global Default' : r.game_name} saved — RTP ${Number(r.rtp)}%` });
    } catch (e) { toast({ title: 'Failed to save', description: e?.message || 'Unknown error' }); }
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Winning Chance (RTP%)</h2>
      <p className="text-xs text-amber-100/60 italic">The <b className="text-amber-200">*</b> row is the global default; each game overrides it. Lower RTP = harder to win.</p>
      <p className="text-xs text-amber-100/60 italic"><b className="text-emerald-300">Demo RTP</b> applies only while a player uses the $1000 practice balance.</p>
      {loading ? (
        <p className="text-amber-100/60">Loading...</p>
      ) : rows.map(r => (
        <GameRtpCard key={r.id} row={r} onSave={save} />
      ))}
    </div>
  );
}