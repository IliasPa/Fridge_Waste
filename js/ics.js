/* Builds an iCalendar (.ics) file: one event per item on its use-by day,
   with alert(s) 1 and/or 2 days before. Times are "floating" (no time zone),
   so the phone shows them in its own local time. */

const pad = (n) => String(n).padStart(2, '0');

function escapeText(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/* RFC 5545: lines longer than 75 octets are folded with CRLF + space. */
function fold(line) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out = [];
  let cur = '';
  let curLen = 0;
  for (const ch of line) {
    const len = new TextEncoder().encode(ch).length;
    if (curLen + len > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = '';
      curLen = 0;
    }
    cur += ch;
    curLen += len;
  }
  out.push(cur);
  return out.join('\r\n ');
}

function stampUTC(d = new Date()) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/**
 * @param events  [{ uid, date:'YYYY-MM-DD', title, description }]
 * @param time    'HH:MM' event time on the use-by day
 * @param alarms  array of days before, e.g. [1] or [1, 2]
 */
export function buildICS(events, { time = '09:00', alarms = [1] } = {}) {
  const [hh, mm] = time.split(':');
  const stamp = stampUTC();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Fridge PWA//Food reminders//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  for (const ev of events) {
    const day = ev.date.replace(/-/g, '');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${day}T${hh}${mm}00`,
      'DURATION:PT15M',
      `SUMMARY:${escapeText(ev.title)}`,
      `DESCRIPTION:${escapeText(ev.description || '')}`,
      'TRANSP:TRANSPARENT',
    );
    for (const d of alarms) {
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapeText(ev.title)}`, `TRIGGER:-P${d}D`, 'END:VALARM');
    }
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
