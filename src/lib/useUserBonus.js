import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// Read-only view of the player's bonus + turnover state. Every number here is
// calculated and stored server-side (user_bonuses / wallets.bonus_balance);
// this hook only displays it.
export function useUserBonus() {
  const [bonus, setBonus] = useState(null);
  const [offer, setOffer] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      const [rows, wallets] = await Promise.all([
        base44.entities.UserBonus.filter({ user_id: me.id }, '-created_date', 50).catch(() => []),
        base44.entities.Wallet.filter({ user_id: me.id }, '-created_date', 1).catch(() => []),
      ]);
      const list = rows || [];
      const active = list.find((b) => b.status === 'active') || null;
      setHistory(list);
      setBonus(active);
      // Unclaimed (opt-in) deposit bonus offer, still inside its claim window.
      setOffer(list.find((b) => b.status === 'offered' && (!b.expires_at || new Date(b.expires_at).getTime() > Date.now())) || null);
      setBonusBalance(Number(wallets?.[0]?.bonus_balance ?? 0) || 0);
      if (active?.campaign_id) {
        const camps = await base44.entities.BonusCampaign.filter({ id: active.campaign_id }, '-created_date', 1).catch(() => []);
        setCampaign(camps?.[0] || null);
      } else {
        setCampaign(null);
      }
    } catch { /* not logged in */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { bonus, offer, campaign, bonusBalance, history, loading, reload: load };
}