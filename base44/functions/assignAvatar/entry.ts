import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Assigns an available (unassigned) anime avatar of the requested gender to
// the calling user and returns its image_url. Called once at signup.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const gender = body.gender === 'female' ? 'female' : 'male';

    // If the user already has an avatar, just return it (idempotent).
    if (user.avatar_url) {
      return Response.json({ image_url: user.avatar_url, gender: user.gender || gender });
    }

    // Find available avatars of this gender (assigned_to empty), oldest first.
    const available = await base44.asServiceRole.entities.Avatar.filter(
      { gender, assigned_to: '' },
      'created_date',
      10
    );

    let chosen = null;
    for (const a of available) {
      try {
        await base44.asServiceRole.entities.Avatar.update(a.id, { assigned_to: user.id });
        chosen = a;
        break;
      } catch {
        // another signup claimed it in the gap — try the next one
      }
    }

    // Fallback: no unassigned avatar of this gender — reuse any avatar of this gender.
    if (!chosen) {
      const any = await base44.asServiceRole.entities.Avatar.filter({ gender }, 'created_date', 1);
      chosen = any[0] || null;
    }

    if (!chosen) return Response.json({ error: 'No avatar available' }, { status: 404 });

    return Response.json({ image_url: chosen.image_url, gender });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}