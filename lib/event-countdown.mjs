export const events = [
  { id: 'christmas', name: 'Christmas', month: 12, day: 25 },
  { id: 'new-year', name: 'New Year’s Day', month: 1, day: 1 },
  { id: 'valentine', name: 'Valentine’s Day', month: 2, day: 14 },
  { id: 'halloween', name: 'Halloween', month: 10, day: 31 },
];
export function localDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y,m,d] = value.split('-').map(Number);
  if (y < 1000) return null;
  const date = new Date(y,m-1,d);
  return date.getFullYear() === y && date.getMonth() === m-1 && date.getDate() === d ? date : null;
}
export function eventCountdown(event, now = new Date()) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new Error('Invalid clock');
  let target = event.date ? localDate(event.date) : new Date(now.getFullYear(), event.month-1, event.day);
  if (!target || !Number.isFinite(target.getTime())) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!event.date && target < today) target = new Date(now.getFullYear()+1,event.month-1,event.day);
  const seconds = Math.max(0,Math.ceil((target-now)/1000));
  return { target, today: +target === +today, past: target < today, days: Math.floor(seconds/86400), hours: Math.floor(seconds%86400/3600), minutes: Math.floor(seconds%3600/60), seconds: seconds%60 };
}
