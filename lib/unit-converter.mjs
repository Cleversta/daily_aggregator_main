// Factors use metres, kilograms, litres, square metres, metres/second, seconds and bytes.
export const unitGroups = {
  length: { label: 'Length', symbol: '↔', note: 'Uses international inches, feet and miles. A nautical mile is 1,852 metres.', units: {
    cm: ['Centimetres (cm)', 0.01], m: ['Metres (m)', 1], mm: ['Millimetres (mm)', 0.001],
    km: ['Kilometres (km)', 1000], in: ['Inches (in)', 0.0254], ft: ['Feet (ft)', 0.3048],
    yd: ['Yards (yd)', 0.9144], mi: ['Miles (mi)', 1609.344], nmi: ['Nautical miles (nmi)', 1852],
  } },
  weight: { label: 'Weight', symbol: '⚖', note: 'Ounces and pounds are avoirdupois, not troy. Metric tonnes and US short tons are different units.', units: {
    g: ['Grams (g)', 0.001], kg: ['Kilograms (kg)', 1], mg: ['Milligrams (mg)', 0.000001],
    oz: ['Ounces (oz)', 0.028349523125], lb: ['Pounds (lb)', 0.45359237],
    st: ['Stone (st)', 6.35029318], t: ['Metric tonnes (t)', 1000], 'US ton': ['US short tons', 907.18474],
  } },
  temperature: { label: 'Temperature', symbol: '°', note: 'Converts temperature readings, not temperature differences.', units: { C: ['Celsius (°C)'], F: ['Fahrenheit (°F)'], K: ['Kelvin (K)'] } },
  volume: { label: 'Volume', symbol: '◒', note: 'US units use customary liquid measures. Metric cups are 250 mL; US cups are about 236.6 mL. Imperial gallons are labelled separately.', units: {
    mL: ['Millilitres (mL)', 0.001], L: ['Litres (L)', 1], 'm³': ['Cubic metres (m³)', 1000],
    'US tsp': ['US teaspoons', 0.00492892159375], 'US tbsp': ['US tablespoons', 0.01478676478125],
    'US cup': ['US customary cups', 0.2365882365], 'metric cup': ['Metric cups (250 mL)', 0.25],
    'US fl oz': ['US fluid ounces', 0.0295735295625], 'US pt': ['US liquid pints', 0.473176473],
    'US qt': ['US liquid quarts', 0.946352946], gal: ['US liquid gallons (gal)', 3.785411784],
    'imp gal': ['Imperial gallons', 4.54609],
  } },
  area: { label: 'Area', symbol: '▧', note: 'Area uses square units. Acres use the international foot.', units: {
    'm²': ['Square metres (m²)', 1], 'ft²': ['Square feet (ft²)', 0.09290304],
    'cm²': ['Square centimetres (cm²)', 0.0001], 'km²': ['Square kilometres (km²)', 1000000],
    'in²': ['Square inches (in²)', 0.00064516], 'yd²': ['Square yards (yd²)', 0.83612736],
    ha: ['Hectares (ha)', 10000], acre: ['Acres', 4046.8564224], 'mi²': ['Square miles (mi²)', 2589988.110336],
  } },
  speed: { label: 'Speed', symbol: '➜', note: 'Knots are nautical miles per hour. Speed values must be nonnegative.', units: {
    'km/h': ['Kilometres per hour (km/h)', 1 / 3.6], mph: ['Miles per hour (mph)', 0.44704],
    'm/s': ['Metres per second (m/s)', 1], 'ft/s': ['Feet per second (ft/s)', 0.3048], kn: ['Knots (kn)', 1852 / 3600],
  } },
  time: { label: 'Time', symbol: '◷', note: 'These are fixed durations: a day is 24 hours and a week is 7 days. Calendar months and years are not included.', units: {
    s: ['Seconds (s)', 1], min: ['Minutes (min)', 60], ms: ['Milliseconds (ms)', 0.001],
    h: ['Hours (h)', 3600], day: ['Days (24 hours)', 86400], week: ['Weeks (7 days)', 604800],
  } },
  storage: { label: 'Data storage', symbol: '▤', note: '1 byte = 8 bits. kB/MB/GB/TB use powers of 1,000; KiB/MiB/GiB/TiB use powers of 1,024.', units: {
    MB: ['Megabytes (MB, decimal)', 1000000], GB: ['Gigabytes (GB, decimal)', 1000000000],
    bit: ['Bits', 0.125], B: ['Bytes (B)', 1], kB: ['Kilobytes (kB, decimal)', 1000], TB: ['Terabytes (TB, decimal)', 1000000000000],
    KiB: ['Kibibytes (KiB, binary)', 1024], MiB: ['Mebibytes (MiB, binary)', 1048576],
    GiB: ['Gibibytes (GiB, binary)', 1073741824], TiB: ['Tebibytes (TiB, binary)', 1099511627776],
  } },
};
export function convertUnit(input, group, from, to) {
  const units = unitGroups[group]?.units;
  if (!units || !Object.hasOwn(units, from) || !Object.hasOwn(units, to)) throw new Error('Choose units from the same category.');
  const text = String(input).trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) throw new Error('Enter a number using a decimal point, without commas.');
  const value = Number(text);
  if (!Number.isFinite(value)) throw new Error('That number is too large.');
  let result;
  if (group === 'temperature') {
    const minimum = { C: -273.15, F: -459.67, K: 0 }[from];
    if (value < minimum) throw new Error('Temperature cannot be below absolute zero.');
    const celsius = from === 'C' ? value : from === 'F' ? (value - 32) * 5 / 9 : value - 273.15;
    result = to === 'C' ? celsius : to === 'F' ? celsius * 9 / 5 + 32 : Math.max(0, celsius + 273.15);
  } else {
    if (value < 0) throw new Error('Use zero or a positive value for this measurement.');
    result = value * (units[from][1] / units[to][1]);
  }
  if (from === to) result = value;
  if (!Number.isFinite(result)) throw new Error('The result is too large. Try a smaller value.');
  return Object.is(result, -0) ? 0 : result;
}
