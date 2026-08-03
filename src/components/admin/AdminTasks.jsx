import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Save, Trash2, Plus, CheckCircle, ExternalLink } from 'lucide-react';

export default function AdminTasks() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [draft, setDraft] = useState({ name: '', label: '', url: '', reward: 5, active: true, order: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.TaskLink.filter({}, 'order', 50);
      setTasks(list);
    } catch { toast({ title: 'Failed to load' }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!draft.name || !draft.label || !draft.url) {
      toast({ title: 'Name, label and URL are required' });
      return;
    }
    setSaving('new');
    try {
      await base44.entities.TaskLink.create({
        name: draft.name.trim().toLowerCase(),
        label: draft.label.trim(),
        url: draft.url.trim(),
        reward: Number(draft.reward) || 5,
        active: draft.active,
        order: Number(draft.order) || 0,
      });
      toast({ title: 'Task created' });
      setDraft({ name: '', label: '', url: '', reward: 5, active: true, order: 0 });
      load();
    } catch (e) { toast({ title: 'Failed to create', description: e?.message }); }
    setSaving(null);
  };

  const update = async (id, data) => {
    setSaving(id);
    try {
      await base44.entities.TaskLink.update(id, data);
      toast({ title: 'Task updated' });
      load();
    } catch (e) { toast({ title: 'Failed to update', description: e?.message }); }
    setSaving(null);
  };

  const remove = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await base44.entities.TaskLink.delete(id);
      toast({ title: 'Task deleted' });
      load();
    } catch (e) { toast({ title: 'Failed to delete', description: e?.message }); }
  };

  const inputCls = 'px-2.5 py-1.5 rounded bg-black/50 border border-amber-700/40 text-amber-100 text-sm w-full';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-amber-300" />
        <h2 className="font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Social Tasks</h2>
      </div>
      <p className="text-xs text-amber-100/60 italic">Create tasks (e.g. follow on X, subscribe on Telegram). Users claim BOUNTY tokens after completing them — tokens show in their Profile allocation.</p>

      {/* Create new task */}
      <div className="rounded-lg border border-amber-700/40 bg-black/30 p-3 flex flex-col gap-2">
        <p className="text-[11px] font-bold text-amber-200 italic">Add new task</p>
        <div className="grid grid-cols-2 gap-2">
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputCls} placeholder="key (e.g. x, telegram)" />
          <input value={draft.reward} onChange={(e) => setDraft({ ...draft, reward: e.target.value })} className={inputCls} type="number" placeholder="reward (5)" />
        </div>
        <input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} className={inputCls} placeholder="Label (e.g. Follow on X)" />
        <input value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} className={inputCls} placeholder="URL (https://...)" />
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-amber-100 text-xs">
            <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
            Active
          </label>
          <button
            onClick={create}
            disabled={saving === 'new'}
            className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-400 text-stone-900 text-sm font-bold italic disabled:opacity-50"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            <Plus className="w-4 h-4" /> {saving === 'new' ? 'Creating...' : 'Add Task'}
          </button>
        </div>
      </div>

      {/* Existing tasks */}
      {loading ? (
        <p className="text-amber-100/60">Loading...</p>
      ) : tasks.length === 0 ? (
        <p className="text-amber-100/50 text-sm italic">No tasks yet. Create one above.</p>
      ) : (
        tasks.map((task) => (
          <div key={task.id} className="rounded-lg border border-amber-700/40 bg-black/30 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" style={{ background: 'rgba(214,178,98,0.15)', color: '#e8c878' }}>{task.name}</span>
              <a href={task.url} target="_blank" rel="noopener noreferrer" className="text-amber-300/70 hover:text-amber-200">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="ml-auto text-[11px] text-amber-100/50">+{task.reward} BOUNTY</span>
            </div>
            <input
              defaultValue={task.label}
              onBlur={(e) => e.target.value !== task.label && update(task.id, { label: e.target.value })}
              className={inputCls}
              placeholder="Label"
            />
            <input
              defaultValue={task.url}
              onBlur={(e) => e.target.value !== task.url && update(task.id, { url: e.target.value })}
              className={inputCls}
              placeholder="URL"
            />
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-amber-100 text-xs">
                <input
                  type="checkbox"
                  checked={task.active}
                  onChange={(e) => update(task.id, { active: e.target.checked })}
                />
                Active
              </label>
              <button
                onClick={() => remove(task.id)}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-300 text-xs font-bold border border-rose-700/40 hover:bg-rose-900/20"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}