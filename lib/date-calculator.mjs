const DAY = 86400000;
export function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Choose a valid date.');
  const [y,m,d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y,m-1,d));
  if (y < 1000 || date.getUTCFullYear() !== y || date.getUTCMonth() !== m-1 || date.getUTCDate() !== d) throw new Error('Choose a valid date between years 1000 and 9999.');
  return date;
}
export function dateDifference(start,end) { return (parseDate(end)-parseDate(start))/DAY; }
export function shiftDate(start,days) {
  if (!Number.isSafeInteger(days)) throw new Error('Enter a whole number of days.');
  const date = new Date(+parseDate(start)+days*DAY);
  if (!Number.isFinite(+date) || date.getUTCFullYear()<1000 || date.getUTCFullYear()>9999) throw new Error('The result must be between years 1000 and 9999.');
  return date.toISOString().slice(0,10);
}
function anniversary(start,months) {
  const first = new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+months,1));
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();
  first.setUTCDate(Math.min(start.getUTCDate(),lastDay));
  return first;
}
export function calendarAge(birth,end) {
  const start = parseDate(birth), finish = parseDate(end);
  if (finish < start) throw new Error('The age date must be on or after the birth date.');
  let months = (finish.getUTCFullYear()-start.getUTCFullYear())*12+finish.getUTCMonth()-start.getUTCMonth();
  if (anniversary(start,months)>finish) months--;
  return {years:Math.floor(months/12),months:months%12,days:(finish-anniversary(start,months))/DAY};
}
