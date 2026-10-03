/* Expiry notifications, without a server.

   Browsers only let a web app show notifications while it is running, so:
   - each time Fridge opens or comes back to the screen, it notifies about
     food that expires tomorrow (or today) it hasn't told you about yet;
   - on Android (Chrome, installed app) the service worker also checks in the
     background about once a day (Periodic Background Sync);
   - iPhone gives web apps no background time without a push server, so for
     an alert at a fixed time, the calendar reminders (.ics) are the reliable way.
   The message itself is built in app.js; this file wraps the browser APIs. */
import { isIOS, isStandalone } from './utils.js';

const BACKGROUND_TAG = 'fridge-expiry-check'; // must match sw.js

/* 'granted' | 'default' | 'denied', or
   'install'     — iPhone Safari tab: only Home Screen apps can notify
   'unsupported' — this browser has no notifications */
export function notifyPermission() {
  if (isIOS() && !isStandalone()) return 'install';
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/* Must be called straight from a tap (browsers require a user gesture). */
export async function requestPermission() {
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

/* The service worker registration, or null if there isn't one (after 3 s). */
function swRegistration() {
  if (!navigator.serviceWorker) return Promise.resolve(null);
  return Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(() => r(null), 3000))]);
}

export async function showNotification(title, body, tag = 'fridge-expiry') {
  const icon = new URL('icons/icon.png', location.href).href;
  const options = { body, tag, icon, badge: icon, data: { url: location.href.split('?')[0] } };
  const reg = await swRegistration();
  // iPhone and Android only support notifications shown by the service worker.
  if (reg && reg.showNotification) return reg.showNotification(title, options);
  new Notification(title, options); // desktop browsers without a service worker
}

/* Turns the Android background check on or off.
   Returns true when the browser agreed to run it. */
export async function setBackgroundCheck(on) {
  try {
    const reg = await swRegistration();
    if (!reg || !reg.periodicSync) return false;
    if (!on) {
      await reg.periodicSync.unregister(BACKGROUND_TAG);
      return false;
    }
    const perm = await navigator.permissions.query({ name: 'periodic-background-sync' });
    if (perm.state !== 'granted') return false; // Chrome grants it to installed apps only
    await reg.periodicSync.register(BACKGROUND_TAG, { minInterval: 12 * 60 * 60 * 1000 });
    return true;
  } catch {
    return false;
  }
}
