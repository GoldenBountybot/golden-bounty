import React from 'react';
import { User as UserIcon } from 'lucide-react';
import FadeImage from '@/components/FadeImage';
import { tgPhotoUrl } from '@/lib/telegram';
import { getCachedSrc } from '@/lib/assetPreloader';

// Round profile avatar with the golden casino ring.
// Priority: the player's Telegram profile picture (loaded directly from
// Telegram's CDN — no storage, no egress cost), then a saved app avatar, then
// a plain icon. Nothing needs to be saved for the Telegram photo to appear.
export default function ProfileAvatar({ avatarUrl, size = 96, className = '' }) {
  const tgPhoto = tgPhotoUrl();
  const src = tgPhoto || (avatarUrl ? getCachedSrc(avatarUrl) : '');

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 14px rgba(212,175,55,0.25)', transform: 'scale(1.1)' }} />
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center relative"
        style={{ border: '2px solid rgba(212,175,55,0.6)', background: 'linear-gradient(135deg, #FFD700, #C89B3C)' }}
      >
        {src ? (
          <FadeImage
            src={src}
            alt="avatar"
            referrerPolicy="no-referrer"
            durationMs={220}
            className="w-full h-full object-cover"
          />
        ) : (
          <UserIcon style={{ width: size * 0.42, height: size * 0.42, color: '#1a1408' }} />
        )}
      </div>
    </div>
  );
}