import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import { Upload, Trash2, Plus, Save } from 'lucide-react';

const METHODS = [
  { id: 'binance', label: 'Binance Pay' },
  { id: 'usdt', label: 'USDT in Crypto' },
  { id: 'crypto', label: 'Crypto' },
];

export default function AdminPaymentAddresses() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);
  const [edits, setEdits] = useState({});
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.PaymentAddress.list('order', 100);
      setItems(list);
    } catch { toast({ title: 'Failed to load' }); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = async (id, field, value) => {
    try {
      await base44.entities.PaymentAddress.update(id, { [field]: value });
      setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
      toast({ title: 'Saved', description: 'Updated for users.' });
    } catch { toast({ title: 'Update failed' }); }
  };

  const saveCard = async (it) => {
    try {
      await base44.entities.PaymentAddress.update(it.id, {
        label: it.label,
        address: it.address || '',
        symbol: it.symbol || '',
        color: it.color || '#f7931a',
        active: it.active,
      });
      setItems(prev => prev.map(i => i.id === it.id ? { ...i, ...it } : i));
      toast({ title: 'Saved', description: 'Users will see the new address.' });
    } catch { toast({ title: 'Save failed' }); }
  };

  const remove = async (id) => {
    try { await base44.entities.PaymentAddress.delete(id); setItems(prev => prev.filter(i => i.id !== id)); toast({ title: 'Removed' }); }
    catch { toast({ title: 'Delete failed' }); }
  };

  const addNew = async () => {
    if (!adding || !adding.method || !adding.label) { toast({ title: 'Method & label required' }); return; }
    try {
      await base44.entities.PaymentAddress.create({
        method: adding.method,
        network: adding.network || adding.label.toLowerCase().replace(/\s+/g, '_'),
        label: adding.label,
        address: adding.address || '',
        qr_image_url: adding.qr_image_url || '',
        symbol: adding.symbol || '',
        color: adding.color || '#f7931a',
        order: adding.order || 99,
        active: true,
      });
      setAdding(null);
      load();
      toast({ title: 'Added' });
    } catch { toast({ title: 'Add failed' }); }
  };

  const uploadImage = async (id, file) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await update(id, 'qr_image_url', file_url);
      toast({ title: 'QR uploaded' });
    } catch { toast({ title: 'Upload failed' }); }
  };

  const grouped = METHODS.map(m => ({ ...m, items: items.filter(i => i.method === m.id) }));

  return (
    <div className="flex flex-col gap-5">
      <WesternFrame className="p-4 flex flex-col gap-3">
        <h2 className="font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Add Payment Record</h2>
        <div className="grid grid-cols-2 gap-2">
          <select value={adding?.method || ''} onChange={e => setAdding(a => ({ ...a, method: e.target.value }))} className="px-2 py-2 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-sm">
            <option value="">Select method</option>
            {METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <input value={adding?.label || ''} onChange={e => setAdding(a => ({ ...a, label: e.target.value }))} placeholder="Label (e.g. BTC Network)" className="px-2 py-2 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-sm" />
          <input value={adding?.address || ''} onChange={e => setAdding(a => ({ ...a, address: e.target.value }))} placeholder="Wallet address (QR methods leave blank)" className="px-2 py-2 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-sm col-span-2" />
          <input value={adding?.symbol || ''} onChange={e => setAdding(a => ({ ...a, symbol: e.target.value }))} placeholder="Symbol (₿ Ξ ₮)" className="px-2 py-2 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-sm" />
          <input value={adding?.color || ''} onChange={e => setAdding(a => ({ ...a, color: e.target.value }))} placeholder="Color (#f7931a)" className="px-2 py-2 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-sm" />
        </div>
        <button onClick={addNew} className="self-start flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 font-bold italic" style={{ fontFamily: 'Georgia, serif' }}>
          <Plus className="w-4 h-4" /> Add
        </button>
      </WesternFrame>

      {grouped.map(g => (
        <div key={g.id} className="flex flex-col gap-2">
          <h3 className="font-black italic text-amber-300" style={{ fontFamily: 'Georgia, serif' }}>{g.label}</h3>
          {loading && <p className="text-amber-100/60 text-sm">Loading...</p>}
          {!loading && g.items.length === 0 && <p className="text-amber-100/40 text-sm italic">None.</p>}
          {g.items.map(it => {
            const edit = edits[it.id] || it;
            const dirty = JSON.stringify(edit) !== JSON.stringify(it);
            return (
            <WesternFrame key={it.id} className="p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0" style={{ background: edit.color || '#f7931a' }}>
                  <span className="text-sm font-black text-white" style={{ fontFamily: 'Georgia, serif' }}>{edit.symbol || '?'}</span>
                </div>
                <input value={edit.label} onChange={e => setEdits(p => ({ ...p, [it.id]: { ...edit, label: e.target.value } }))} className="flex-1 px-2 py-1.5 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-sm font-bold" />
                <label className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-amber-600/60 bg-black/40 text-amber-200 text-xs cursor-pointer hover:bg-black/60" title="Upload QR image">
                  <Upload className="w-3.5 h-3.5" />
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(it.id, e.target.files[0])} />
                </label>
                <button onClick={() => remove(it.id)} className="p-1.5 rounded-md border border-rose-600/50 bg-black/40 text-rose-400 hover:bg-rose-900/40"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={edit.symbol || ''} onChange={e => setEdits(p => ({ ...p, [it.id]: { ...edit, symbol: e.target.value } }))} placeholder="Symbol" className="px-2 py-1.5 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-xs" />
                <input value={edit.color || ''} onChange={e => setEdits(p => ({ ...p, [it.id]: { ...edit, color: e.target.value } }))} placeholder="Color" className="px-2 py-1.5 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-xs" />
              </div>
              {it.method === 'binance' && (
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-white p-1.5 shrink-0" style={{ boxShadow: '0 0 0 1px rgba(190,140,55,0.4)' }}>
                    {it.qr_image_url ? (
                      <img src={it.qr_image_url} alt="Binance QR" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400 text-[10px] italic text-center">No image</div>
                    )}
                  </div>
                  <label className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 font-bold italic cursor-pointer hover:brightness-110 active:scale-95 text-xs" style={{ fontFamily: 'Georgia, serif' }} title="Upload new Binance Pay QR image">
                    <Upload className="w-3.5 h-3.5" /> Upload New Image
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(it.id, e.target.files[0])} />
                  </label>
                </div>
              )}
              <input value={edit.address || ''} onChange={e => setEdits(p => ({ ...p, [it.id]: { ...edit, address: e.target.value } }))} placeholder="Wallet address" className="px-2 py-1.5 rounded bg-black/40 border border-amber-700/40 text-amber-100 text-xs font-mono" />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-amber-100/70">
                  <input type="checkbox" checked={edit.active} onChange={e => setEdits(p => ({ ...p, [it.id]: { ...edit, active: e.target.checked } }))} className="accent-amber-400" /> Active (visible to users)
                </label>
                <button
                  onClick={() => saveCard(edit)}
                  disabled={!dirty}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md font-bold italic text-xs border transition-all ${dirty ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 border-amber-300 active:scale-95' : 'bg-black/40 text-amber-100/40 border-amber-700/30 cursor-not-allowed'}`}
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            </WesternFrame>
            );
          })}
        </div>
      ))}
    </div>
  );
}