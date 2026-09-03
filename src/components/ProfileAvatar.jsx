import React, { useState } from 'react';
import { User as UserIcon } from 'lucide-react';
import { tgPhotoUrl } from '@/lib/telegram';

// Shows the player's Telegram profile picture when the app runs inside
// Telegram. The image is served straight from Telegram's own CDN
// (t.me/i/userpic/...), so nothing is uploaded, stored or proxied through our
// backend — it costs zero egress. If Telegram has no photo (or the user hides
// it), we silently fall back to the assigned in-app avatar.
export default function ProfileAvatar({ fallbackSrc }) {
  const [tgFailed, setTgFailed] = useState(false);
  const tgSrc = tgFailed ? '' : tgPhotoUrl();
  const src = tgSrc || fallbackSrc;

  if (!src) return <UserIcon className="w-10 h-10" style={{ color: '#1a1408' }} />;

  return (
    <img
      src={src}
      alt="avatar"
      referrerPolicy="no-referrer"
      className="w-full h-full object-cover"
      onError={() => { if (tgSrc) setTgFailed(true); }}
    />
  );
}