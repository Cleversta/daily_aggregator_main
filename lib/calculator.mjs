export function parseNumber(value) {
  const text = String(value).trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) throw new Error('Enter a number in both fields. Use a decimal point, without commas.');
  const number = Number(text);
  if (!Number.isFinite(number)) throw new Error('That number is too large.');
  return number;
}
export function calculate(first, second, operation) {
  const a = parseNumber(first), b = parseNumber(second);
  let value;
  switch (operation) {
    case 'add': value = a + b; break;
    case 'subtract': value = a - b; break;
    case 'multiply': value = a * b; break;
    case 'divide':
      if (b === 0) throw new Error('Cannot divide by zero.');
      value = a / b; break;
    case 'percent': value = (a / 100) * b; break;
    case 'portion':
      if (b === 0) throw new Error('The whole cannot be zero.');
      value = (a / b) * 100; break;
    case 'change':
      if (a === 0) throw new Error('Percentage change is undefined when the original value is zero.');
      value = ((b - a) / Math.abs(a)) * 100; break;
    default: throw new Error('Choose a supported calculation.');
  }
  if (!Number.isFinite(value)) throw new Error('The result is too large. Try smaller numbers.');
  return Object.is(value, -0) ? 0 : value;
}
export function formatResult(value) { return Number(value.toPrecision(12)).toString(); }
