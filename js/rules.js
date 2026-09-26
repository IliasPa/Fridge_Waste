/* Date rules: default shelf life, "Opened", and moving between locations.
   The numbers themselves live in defaults.js. */
import { CATEGORIES, QUICK_PICKS } from './defaults.js';
import { todayStr, addDays } from './utils.js';

export const cat = (id) => CATEGORIES[id] || CATEGORIES.other;
export const pickById = (id) => QUICK_PICKS.find((p) => p.id === id);

const earlier = (a, b) => (a < b ? a : b);
const later = (a, b) => (a > b ? a : b);

/* Where an item normally goes. */
export function homeLocation(category, pickId) {
  const p = pickId && pickById(pickId);
  return (p && p.loc) || cat(category).home || 'fridge';
}

/* Default expiry for a new item. A quick pick's own `days` applies only in
   its usual location; elsewhere the category table decides. */
export function defaultExpiry(category, location, pickId) {
  const p = pickId && pickById(pickId);
  let days;
  if (p && p.days != null && location === homeLocation(category, pickId)) days = p.days;
  else days = cat(category)[location] ?? CATEGORIES.other[location] ?? 7;
  return addDays(todayStr(), days);
}

/* New expiry after tapping "Opened": at most `opened` days from today.
   Returns the unchanged date if opening doesn't matter (or it's frozen). */
export function openedExpiry(item) {
  const days = cat(item.category).opened;
  if (days == null || item.location === 'freezer') return item.expiresAt;
  return earlier(item.expiresAt, addDays(todayStr(), days));
}

/* New expiry after moving an item.
   - into the freezer: extends to the category's freezer life
   - out of the freezer: short "thawed" life
   - fridge <-> pantry: keeps the date, but never longer than the target allows */
export function movedExpiry(item, to) {
  const c = cat(item.category);
  const today = todayStr();
  if (to === item.location) return item.expiresAt;
  if (to === 'freezer') {
    return later(item.expiresAt, addDays(today, c.freezer ?? CATEGORIES.other.freezer));
  }
  if (item.location === 'freezer') {
    return addDays(today, c.thawed ?? 2);
  }
  const days = c[to];
  if (days == null) return item.expiresAt;
  return earlier(item.expiresAt, addDays(today, days));
}
