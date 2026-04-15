// lib/eventFilters.js

export const parseEventDate = (date) => {
  if (!date) return null;

  // FIX: Supabase format "2026-05-02 00:00:00"
  const normalized = date.replace(" ", "T");
  const d = new Date(normalized);

  if (isNaN(d.getTime())) return null;

  return d;
};

// ONLY DATE RULE
export const isEventVisible = (ev) => {
  const d = parseEventDate(ev.date);
  if (!d) return true; // don't break if bad data

  return d.getTime() >= Date.now();
};