import { supabase } from '@/api/supabaseClient';
import { TABLES, toColumn, rowOut, rowIn } from '@/api/supabaseMaps';

// Applies a Base44-style filter object to a Supabase query.
// Supports plain equality plus $gte/$gt/$lte/$lt/$ne/$in operators.
function applyFilter(query, filterObj) {
  for (const [key, value] of Object.entries(filterObj || {})) {
    const col = toColumn(key);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [op, v] of Object.entries(value)) {
        if (op === '$gte') query = query.gte(col, v);
        else if (op === '$gt') query = query.gt(col, v);
        else if (op === '$lte') query = query.lte(col, v);
        else if (op === '$lt') query = query.lt(col, v);
        else if (op === '$ne') query = query.neq(col, v);
        else if (op === '$in') query = query.in(col, v);
      }
    } else {
      query = query.eq(col, value);
    }
  }
  return query;
}

function applySort(query, sort) {
  if (!sort) return query;
  const desc = sort.startsWith('-');
  return query.order(toColumn(desc ? sort.slice(1) : sort), { ascending: !desc });
}

function unwrap({ data, error }) {
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data.map(rowOut) : rowOut(data);
}

function entityApi(name) {
  const table = TABLES[name] || name;
  const from = () => supabase.from(table);

  return {
    async list(sort, limit) {
      let q = applySort(from().select('*'), sort);
      if (limit) q = q.limit(limit);
      return unwrap(await q);
    },
    async filter(filterObj, sort, limit) {
      let q = applyFilter(from().select('*'), filterObj);
      q = applySort(q, sort);
      if (limit) q = q.limit(limit);
      return unwrap(await q);
    },
    async get(id) {
      return unwrap(await from().select('*').eq('id', id).single());
    },
    async create(data) {
      return unwrap(await from().insert(rowIn(data)).select().single());
    },
    async bulkCreate(rows) {
      return unwrap(await from().insert((rows || []).map(rowIn)).select());
    },
    async update(id, data) {
      return unwrap(await from().update(rowIn(data)).eq('id', id).select().single());
    },
    async bulkUpdate(rows) {
      const out = [];
      for (const row of rows || []) {
        const { id, ...rest } = row;
        out.push(unwrap(await from().update(rowIn(rest)).eq('id', id).select().single()));
      }
      return out;
    },
    async delete(id) {
      const { error } = await from().delete().eq('id', id);
      if (error) throw new Error(error.message);
      return { success: true };
    },
    async deleteMany(filterObj) {
      const { error } = await applyFilter(from().delete(), filterObj);
      if (error) throw new Error(error.message);
      return { success: true };
    },
    subscribe(callback) {
      const channel = supabase
        .channel(`rt_${table}_${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          const type = payload.eventType === 'INSERT' ? 'create'
            : payload.eventType === 'DELETE' ? 'delete' : 'update';
          const data = rowOut(payload.new && Object.keys(payload.new).length ? payload.new : payload.old);
          callback({ id: data?.id, type, data });
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    },
  };
}

export const entities = new Proxy({}, {
  get(cache, name) {
    if (typeof name !== 'string') return undefined;
    if (!cache[name]) cache[name] = entityApi(name);
    return cache[name];
  },
});