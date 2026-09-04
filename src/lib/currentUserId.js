// Reads the logged-in user's id SYNCHRONOUSLY from the stored Supabase session.
// Needed so cached account data (profile, balance) is only shown when it
// belongs to the account that is actually logged in right now — switching
// Telegram accounts must never flash the previous account's details.
export function getCurrentUserIdSync() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
        const s = JSON.parse(localStorage.getItem(k));
        const id = s?.user?.id;
        if (id) return id;
      }
    }
  } catch { /* ignore */ }
  return null;
}