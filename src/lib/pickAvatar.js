import { base44 } from '@/api/base44Client';
import { preloadImage } from '@/lib/assetPreloader';

// Picks a random avatar of the given gender and fully downloads + decodes it
// (pinned in memory) BEFORE returning, so the profile can swap to it with no
// visible download.
export async function pickRandomAvatar(gender) {
  const rows = await base44.entities.Avatar.filter({ gender }, 'created_date', 300);
  if (!rows.length) return null;
  const chosen = rows[Math.floor(Math.random() * rows.length)];
  await preloadImage(chosen.image_url, false, true, true);
  return chosen.image_url;
}