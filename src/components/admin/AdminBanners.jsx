import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import { Plus, Trash2, Save, Upload, X } from 'lucide-react';

const empty = { title: '', description: '', image_url: '', link: '', link_label: '', active: true, order: 0 };

export default function AdminBanners() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try { setRows(await base44.entities.Banner.list('order')); }
    catch { toast({ title: 'Failed to load' }); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const startNew = () => setEditing({ ...empty });
  const edit = (r) => setEditing({ ...r });
  const set = (k, v) => setEditing((e) => ({ ...e, [k]: v }));

  const uploadImage = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set('image_url', file_url);
      toast({ title: 'Image uploaded' });
    } catch { toast({ title: 'Upload failed' }); }
    setUploading(false);
  };

  const save = async () => {
    if (!editing.title.trim()) { toast({ title: 'Title is required' }); return; }
    try {
      if (editing.id) {
        await base44.entities.Banner.update(editing.id, {
          title: editing.title, description: editing.description,
          image_url: editing.image_url, link: editing.link,
          link_label: editing.link_label, active: editing.active,
          order: Number(editing.order) || 0,
        });
      } else {
        await base44.entities.Banner.create({
          title: editing.title, description: editing.description,
          image_url: editing.image_url, link: editing.link,
          link_label: editing.link_label, active: editing.active,
          order: Number(editing.order) || 0,
        });
      }
      toast({ title: 'Banner saved' });
      setEditing(null);
      load();
    } catch { toast({ title: 'Failed to save' }); }
  };

  const remove = async (id) => {
    try { await base44.entities.Banner.delete(id); toast({ title: 'Banner deleted' }); load(); }
    catch { toast({ title: 'Failed to delete' }); }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Home Banners</h2>
        <button onClick={startNew} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400 text-stone-900 text-sm font-bold italic" style={{ fontFamily: 'Georgia, serif' }}>
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      <p className="text-xs text-amber-100/60 italic">Up to 5 active banners rotate on the home page (3s each). Banner click opens its hidden link (game or website).</p>

      {loading ? (
        <p className="text-amber-100/60">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-amber-100/60 italic">No banners yet. Add one.</p>
      ) : rows.map((r) => (
        <WesternFrame key={r.id} className="p-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            {r.image_url && <img src={r.image_url} alt="" className="w-12 h-9 object-cover rounded border border-amber-700/40" />}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-100 truncate">{r.title}</p>
              <p className="text-[11px] text-amber-100/50 truncate">→ {r.link || 'no link'} · {r.active ? 'Active' : 'Hidden'} · order {r.order}</p>
            </div>
            <button onClick={() => edit(r)} className="px-2 py-1 rounded bg-black/40 border border-amber-700/40 text-amber-200 text-xs">Edit</button>
            <button onClick={() => remove(r.id)} className="p-1.5 rounded bg-rose-900/50 border border-rose-700/40 text-rose-200"><Trash2 className="w-4 h-4" /></button>
          </div>
        </WesternFrame>
      ))}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-3" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-xl p-4 flex flex-col gap-2.5" style={{ background: 'linear-gradient(to bottom, #2a1d0e, #14100a)', border: '1px solid rgba(190,140,55,0.8)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>{editing.id ? 'Edit Banner' : 'New Banner'}</h3>
              <button onClick={() => setEditing(null)} className="text-amber-200/70"><X className="w-5 h-5" /></button>
            </div>

            <label className="text-[11px] text-amber-100/70 italic">Title *</label>
            <input value={editing.title} onChange={(e) => set('title', e.target.value)} className="px-2.5 py-1.5 rounded bg-black/50 border border-amber-700/40 text-amber-100 text-sm" placeholder="Welcome to the Saloon" />

            <label className="text-[11px] text-amber-100/70 italic">Announcement / Sub-text</label>
            <textarea value={editing.description} onChange={(e) => set('description', e.target.value)} rows={2} className="px-2.5 py-1.5 rounded bg-black/50 border border-amber-700/40 text-amber-100 text-sm" placeholder="Optional announcement text" />

            <label className="text-[11px] text-amber-100/70 italic">Banner Image (optional)</label>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-amber-700/40 text-amber-200 text-xs cursor-pointer">
                <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
              </label>
              {editing.image_url && <img src={editing.image_url} alt="" className="w-16 h-10 object-cover rounded border border-amber-700/40" />}
            </div>

            <label className="text-[11px] text-amber-100/70 italic">Link (hidden — game route or website URL)</label>
            <input value={editing.link} onChange={(e) => set('link', e.target.value)} className="px-2.5 py-1.5 rounded bg-black/50 border border-amber-700/40 text-amber-100 text-sm" placeholder="/games/wild-bounty  or  https://example.com" />

            <label className="text-[11px] text-amber-100/70 italic">Button Label (optional)</label>
            <input value={editing.link_label} onChange={(e) => set('link_label', e.target.value)} className="px-2.5 py-1.5 rounded bg-black/50 border border-amber-700/40 text-amber-100 text-sm" placeholder="Play Now" />

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-amber-100/80">
                <input type="checkbox" checked={editing.active} onChange={(e) => set('active', e.target.checked)} /> Active
              </label>
              <label className="flex items-center gap-1.5 text-xs text-amber-100/80">
                Order
                <input type="number" value={editing.order} onChange={(e) => set('order', e.target.value)} className="w-16 px-2 py-1 rounded bg-black/50 border border-amber-700/40 text-amber-100" />
              </label>
              <button onClick={save} className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-400 text-stone-900 text-sm font-bold italic" style={{ fontFamily: 'Georgia, serif' }}>
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}