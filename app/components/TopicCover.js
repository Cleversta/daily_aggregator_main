// Original decorative SVG artwork, not official brand imagery.
// Keep this deterministic: it renders on both the server and the client.
const styles = {
  'ai-software': ['#213D63', '#B6D5E8', 'chip'],
  'consumer-tech': ['#315759', '#C3DED5', 'device'],
  'big-tech': ['#393E68', '#C6CAEC', 'network'],
  'social-media': ['#67405A', '#F0C1D1', 'chat'],
  'tools-productivity': ['#365445', '#CEE1B8', 'tasks'],
  'finance-crypto': ['#4B3D65', '#E7CF8D', 'chart'],
  entertainment: ['#684237', '#F2C3A1', 'film'],
  celebrities: ['#64445C', '#E7C1D9', 'star'],
  'science-space': ['#283753', '#B9CDEB', 'planet'],
  automotive: ['#355363', '#B9DADF', 'car'],
  energy: ['#365840', '#D2E2A1', 'energy'],
  'world-affairs': ['#3C5363', '#BFDADB', 'globe'],
};

function Motif({ kind }) {
  switch (kind) {
    case 'chip': return <><rect x="-48" y="-48" width="96" height="96" rx="15" /><path d="M-25-25h50v50h-50zM-24-48v-24M0-48v-24M24-48v-24M-24 48v24M0 48v24M24 48v24M-48-24h-24M-48 0h-24M-48 24h-24M48-24h24M48 0h24M48 24h24" /></>;
    case 'device': return <><rect x="-37" y="-68" width="74" height="136" rx="14" /><path d="M-14-52h28M-9 52H9M-21-25l42 50M21-25l-42 50" /></>;
    case 'network': return <><path d="m0-48-51 84H51ZM0-48V8m-51 28L0 8l51 28" /><circle cy="-48" r="18" /><circle cx="-51" cy="36" r="18" /><circle cx="51" cy="36" r="18" /><circle cy="8" r="12" /></>;
    case 'chat': return <><path d="M-55-49H36a14 14 0 0 1 14 14v49a14 14 0 0 1-14 14H-8l-30 25V28h-17a14 14 0 0 1-14-14v-49a14 14 0 0 1 14-14ZM-42-22h65M-42-3H8M-11 49h44l27 20V49h9V-6" /></>;
    case 'tasks': return <><rect x="-49" y="-59" width="98" height="124" rx="12" /><rect x="-22" y="-69" width="44" height="20" rx="6" /><path d="m-31-19 7 7 14-16M4-20h25m-60 34 7 7 14-16M4 13h25m-60 33 7 7 14-16M4 45h25" /></>;
    case 'chart': return <><path d="M-65-57V59H65M-43 37V13M-12 37v-48M19 37v-32M50 37v-69M-47-12l34-30 32 14 38-37m-23 0h23v23" /></>;
    case 'film': return <><rect x="-68" y="-46" width="136" height="92" rx="12" /><path d="m-13-22 35 22-35 22ZM-46-46v92M46-46v92M-68-23h22M-68 0h22M-68 23h22M46-23h22M46 0h22M46 23h22" /></>;
    case 'star': return <><path d="m0-64 19 40 45 7-32 32 8 45L0 39l-40 21 8-45-32-32 45-7ZM-65-62v20m-10-10h20M67 45v20m-10-10h20" /></>;
    case 'planet': return <><circle r="49" /><ellipse rx="83" ry="23" transform="rotate(-28)" /><path d="M42-65v16m-8-8h16M-63 43v12m-6-6h12M-18-26q18-16 36 0" /></>;
    case 'car': return <><path d="m-65 13 14-38h91l23 38v33H-65ZM-45 13h95M-11-25v38M-55 29h18M36 29h17" /><circle cx="-39" cy="48" r="13" /><circle cx="38" cy="48" r="13" /><path d="M-54-47h69M29-47h18" /></>;
    case 'energy': return <><path d="m11-66-54 78H-3l-8 54 54-78H3ZM-66-41l10 10M58 37l10 10M-68 43l12-9M54-36l13-10" /></>;
    default: return <><circle r="63" /><ellipse rx="28" ry="63" /><path d="M-63 0H63M-53-33H53M-53 33H53" /></>;
  }
}

export default function TopicCover({ topic, compact = false, className = '' }) {
  const [background, accent, kind] = styles[topic.topicCategory] || styles['world-affairs'];
  const seed = [...topic.slug].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 0);
  const angle = (seed % 17) - 8;
  return (
    <div className={`topic-cover ${compact ? 'topic-cover-compact' : ''} ${className}`} style={{ backgroundColor: background, '--cover-accent': accent }} aria-hidden="true">
      <svg viewBox="0 0 600 320" fill="none" className="topic-cover-art" preserveAspectRatio="xMidYMid slice">
        <circle cx={430 + seed % 60} cy="95" r="190" fill={accent} opacity=".1" />
        <circle cx="50" cy="330" r={160 + seed % 40} fill={accent} opacity=".08" />
        <g stroke={accent} opacity=".12"><path d="M0 80h600M0 160h600M0 240h600M100 0v320M200 0v320M300 0v320M400 0v320M500 0v320" /><circle cx="420" cy="148" r="112" /><circle cx="420" cy="148" r="138" /></g>
        <g transform={`translate(${compact ? 300 : 440} 145) rotate(${angle})`} stroke={accent} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"><Motif kind={kind} /></g>
        <g fill={accent}><circle cx="70" cy="48" r="4" /><circle cx="550" cy="265" r="4" /><path d="m540 42 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" /></g>
      </svg>
      {!compact && <div className="topic-cover-copy"><span className="topic-cover-label">{topic.topicCategory.replace(/-/g, ' ')}</span><span className="topic-cover-name">{topic.topicName}</span><span className="topic-cover-footer">The topic edit <span>↗</span></span></div>}
    </div>
  );
}
