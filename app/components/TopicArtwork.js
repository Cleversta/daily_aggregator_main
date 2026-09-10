// Decorative, locally rendered artwork: no external image requests.
export default function TopicArtwork({ topic = 'ai', className = '' }) {
  const football = topic === 'football';
  const crypto = topic === 'crypto';
  return (
    <svg viewBox="0 0 480 270" fill="none" aria-hidden="true" className={className}>
      <rect width="480" height="270" fill={football ? '#174D43' : crypto ? '#363052' : '#233B62'} />
      <circle cx="395" cy="45" r="160" fill={football ? '#277565' : crypto ? '#53436F' : '#345583'} />
      <circle cx="35" cy="280" r="130" fill={football ? '#216253' : crypto ? '#44375E' : '#294771'} />
      <g stroke="white" opacity=".09">
        {[60, 120, 180, 240, 300, 360, 420].map(x => <path key={x} d={`M${x} 0v270`} />)}
        {[45, 90, 135, 180, 225].map(y => <path key={y} d={`M0 ${y}h480`} />)}
      </g>
      {football ? <g>
        <rect x="72" y="42" width="336" height="186" rx="8" stroke="#A4CDB4" strokeWidth="2" />
        <path d="M240 42v186M72 92h54v86H72M408 92h-54v86h54" stroke="#A4CDB4" strokeWidth="2" />
        <circle cx="240" cy="135" r="49" stroke="#A4CDB4" strokeWidth="2" />
        <circle cx="268" cy="127" r="55" fill="#FCF6E6" />
        <path d="m268 101 24 18-9 29h-30l-9-29Z" fill="#173F38" />
        <path d="m268 101-4-27m28 45 27-6m-36 35 16 24m-46-24-18 23m9-52-27-5" stroke="#173F38" strokeWidth="5" />
        <path d="m150 179 37-31-9-22 34-29" stroke="#F0C674" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 9" />
      </g> : crypto ? <g>
        <path d="m65 203 60-33 49 14 58-71 49 22 55-57 74-34" stroke="#B6A2D3" strokeWidth="3" strokeLinecap="round" />
        <path d="M88 222v-27m43 27v-43m43 43v-27m43 27v-60m43 60v-48m43 48v-68m43 68v-104m43 104V92" stroke="#B6A2D3" strokeWidth="16" opacity=".25" />
        <circle cx="240" cy="125" r="73" fill="#EBC36E" stroke="#F9E5B3" strokeWidth="5" />
        <circle cx="240" cy="125" r="59" stroke="#9F762E" strokeWidth="2" />
        <path d="M223 87v77m-10-67h35c27 0 27 28 0 28h-25m0 0h28c29 0 29 30 0 30h-38m21-68V75m13 12V75m-13 89v11m13-11v11" stroke="#664B20" strokeWidth="7" strokeLinecap="round" />
      </g> : <g>
        <g stroke="#8CAFD3" strokeWidth="3">
          <path d="M192 88h-52l-26-28H68m124 70H79m113 43h-44l-30 36H70M288 88h46l31-28h47m-124 70h111m-111 43h48l28 36h48" />
          {[80, 130, 180].map(y => <g key={y}><circle cx="79" cy={y} r="5" fill="#F0C674" /><circle cx="400" cy={y} r="5" fill="#F0C674" /></g>)}
        </g>
        <rect x="169" y="61" width="142" height="148" rx="28" fill="#DDE8EB" />
        <rect x="184" y="76" width="112" height="118" rx="19" fill="#182C4A" />
        <path d="m240 93 12 28 28 13-28 12-12 29-12-29-28-12 28-13Z" fill="#F0C674" />
      </g>}
      <g fill="#F0C674"><circle cx="42" cy="43" r="4" /><path d="M432 214v16m-8-8h16" stroke="#F0C674" strokeWidth="2" /></g>
    </svg>
  );
}
