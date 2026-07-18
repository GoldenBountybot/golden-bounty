import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import { Save, Upload, Layers } from 'lucide-react';

const SETTING_KEY = 'stack_banner';
const DEFAULT_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/ce2101293_InShot_20260718_173817740.jpg';

export default function AdminStackBanner() {
  const [rec, setRec] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.SiteSetting.filter({ name: SETTING_KEY });
      const r = list[0] || null;
      setRec(r);
      setImageUrl(r?.image_url || DEFAULT_IMG);
    } catch { toast({ title: 'Failed to load' }); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const uploadImage = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
      toast({ title: 'Image uploaded' });
    } catch { toast({ title: 'Upload failed' }); }
    setUploading(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (rec?.id) {
        await base44.entities.SiteSetting.update(rec.id, { image_url: imageUrl, active: true });
      } else {
        await base44.entities.SiteSetting.create({ name: SETTING_KEY, image_url: imageUrl, active: true });
      }
      toast({ title: 'Stack banner updated' });
      load();
    } catch { toast({ title: 'Failed to save' }); }
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Layers className="w-5 h-5 text-amber-300" />
        <h2 className="font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Stack Banner</h2>
      </div>
      <p className="text-xs text-amber-100/60 italic">This image appears at the top of the Stack tab on the user Dashboard.</p>

      {loading ? (
        <p className="text-amber-100/60">Loading...</p>
      ) : (
        <WesternFrame className="p-3 flex flex-col gap-3">
          <div className="rounded-lg overflow-hidden border border-amber-700/40">
            <img src={imageUrl || DEFAULT_IMG} alt="Stack banner preview" className="w-full h-auto block" />
          </div>

          <label className="text-[11px] text-amber-100/70 italic">Image URL</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="px-2.5 py-1.5 rounded bg-black/50 border border-amber-700/40 text-amber-100 text-sm"
            placeholder="Paste image URL or upload below"
          />

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-amber-700/40 text-amber-200 text-xs cursor-pointer">
              <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload Image'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
            </label>
            <button
              onClick={save}
              disabled={saving}
              className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-400 text-stone-900 text-sm font-bold italic disabled:opacity-50"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </WesternFrame>
      )}
    </div>
  );
}