import { base44 } from '@/api/base44Client';

// Country tags for agents. The agent role itself lives in the auth profile
// (agent-ops); this entity only holds the public country/name info players see.
export function listAgentProfiles() {
  return base44.entities.AgentProfile.list('-created_date', 500).catch(() => []);
}

export async function saveAgentProfile(user, country) {
  const existing = await base44.entities.AgentProfile.filter({ agent_user_id: user.id }).catch(() => []);
  const data = {
    agent_user_id: user.id,
    username: user.username || '',
    full_name: user.full_name || '',
    uid: user.uid || '',
    country_code: country?.code || '',
    country_name: country?.name || '',
    active: true,
  };
  if (existing[0]) return base44.entities.AgentProfile.update(existing[0].id, data);
  return base44.entities.AgentProfile.create(data);
}

export async function removeAgentProfile(userId) {
  const rows = await base44.entities.AgentProfile.filter({ agent_user_id: userId }).catch(() => []);
  await Promise.all(rows.map((r) => base44.entities.AgentProfile.delete(r.id)));
}