// Shared "golden glass" card look used by every notification surface:
// the top popup toaster, the action toasts, and the Notifications list.
export const GOLD_GLASS = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,225,150,0.08) 100%)',
  border: '1px solid rgba(245,210,120,0.5)',
  boxShadow: '0 8px 28px rgba(0,0,0,0.35), 0 0 18px rgba(255,200,90,0.18), inset 0 1px 0 rgba(255,255,255,0.28)',
  backdropFilter: 'blur(16px) saturate(160%)',
  WebkitBackdropFilter: 'blur(16px) saturate(160%)',
};

// Top offset for slide-in notification surfaces — slightly lower than before.
export const GLASS_TOP_OFFSET = 'calc(env(safe-area-inset-top) + 104px)';