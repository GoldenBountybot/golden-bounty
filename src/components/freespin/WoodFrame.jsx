import React from 'react';

// Two AI-generated premium western wooden frames: one wider plaque for the
// win-message banner, one ornate button frame for the spin control. Both are
// applied via CSS border-image so the carved corners stay crisp while the
// edges stretch to fit the content.

export const FRAME_MSG_URL =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/6cf5b3160_generated_image.png';
export const FRAME_BTN_URL =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/018525478_generated_image.png';

export const msgFrameStyle = {
  borderStyle: 'solid',
  borderWidth: '24px',
  borderImage: `url(${FRAME_MSG_URL}) 28% stretch`,
  background: 'transparent',
};

export const btnFrameStyle = {
  borderStyle: 'solid',
  borderWidth: '22px',
  borderImage: `url(${FRAME_BTN_URL}) 26% stretch`,
  background: 'transparent',
};

export default function WoodFrame({ variant = 'msg', className = '', style, children }) {
  const s = variant === 'btn' ? btnFrameStyle : msgFrameStyle;
  return (
    <div className={className} style={{ ...s, ...style }}>
      {children}
    </div>
  );
}