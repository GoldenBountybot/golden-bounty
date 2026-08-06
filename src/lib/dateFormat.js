// The backend stores created_date as a UTC timestamp but returns it as a
// "naive" ISO string (no trailing "Z" or offset), so JavaScript parses it as
// local time and the browser never converts it — users see UTC instead of
// their own local time. These helpers re-interpret naive strings as UTC,
// then format using the browser's local timezone so every user sees their
// own country's time for deposits, withdrawals, chat, and notifications.

function toDate(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr);
  // ISO-like string with a time component but no timezone marker → treat as UTC
  if (/T\d{2}:\d{2}/.test(s) && !/[Zz]$|[+-]\d{2}:?\d{2}$/.test(s)) {
    return new Date(s + 'Z');
  }
  return new Date(s);
}

export function formatDateTime(dateStr, opts) {
  const d = toDate(dateStr);
  return d ? d.toLocaleString(undefined, opts) : '';
}

export function formatTime(dateStr) {
  const d = toDate(dateStr);
  return d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
}

export function formatDate(dateStr) {
  const d = toDate(dateStr);
  return d ? d.toLocaleDateString() : '';
}

export { toDate };