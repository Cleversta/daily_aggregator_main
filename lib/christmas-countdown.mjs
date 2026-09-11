export function christmasCountdown(now = new Date()) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) throw new Error('Use a valid date.');
  const celebrating = now.getMonth() === 11 && now.getDate() === 25;
  const year = now.getFullYear() + (now.getMonth() === 11 && now.getDate() > 25 ? 1 : 0);
  const target = new Date(year, 11, 25);
  const seconds = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 1000));
  return { year, celebrating, days: Math.floor(seconds / 86400), hours: Math.floor(seconds % 86400 / 3600), minutes: Math.floor(seconds % 3600 / 60), seconds: seconds % 60 };
}
