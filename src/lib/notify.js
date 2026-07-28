import { base44 } from '@/api/base44Client';

// Helper to push a notification record. `user_id` = '' creates a broadcast
// (visible to every user) — used for admin notices and bonus-arrived alerts.
// Per-user notifications pass the target user's id.
export async function pushNotification({ user_id = '', type = 'system', title, body = '', amount = 0, link = '' }) {
  try {
    await base44.entities.UserNotification.create({
      user_id,
      type,
      title,
      body,
      amount: Number(amount) || 0,
      link,
    });
  } catch {
    /* notifications are best-effort; never block the calling flow */
  }
}