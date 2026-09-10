const themes = {
  images: ['#DDEBE5', '#285B50'], documents: ['#E9E3F2', '#594374'],
  coding: ['#DFE8F1', '#345578'], money: ['#EEE7CE', '#725C27'],
  writing: ['#F3E1D7', '#84513A'], design: ['#EBDFF0', '#754985'],
  cooking: ['#F3E4D1', '#88582F'], home: ['#DFE9D8', '#49643D'],
};
export default function GuideArtwork({ category = 'images', className = '' }) {
  const [background, ink] = themes[category] || themes.images;
  return <svg viewBox="0 0 400 220" fill="none" aria-hidden="true" className={`guide-artwork ${className}`}>
    <rect width="400" height="220" fill={background} />
    <circle cx="315" cy="45" r="120" fill={ink} opacity=".06" />
    <circle cx="80" cy="210" r="95" fill={ink} opacity=".05" />
    <g stroke={ink} opacity=".15"><circle cx="200" cy="110" r="90" /><path d="M35 110h330M200 15v190" strokeDasharray="3 7" /></g>
    <g className="guide-art-sheet">
      <rect x="129" y="39" width="152" height="151" rx="17" fill={ink} opacity=".12" transform="rotate(-9 205 115)" />
      <rect x="123" y="30" width="154" height="150" rx="16" fill="#FFFEF9" stroke={ink} strokeWidth="2" />
      <path d="M123 59h154" stroke={ink} opacity=".2" /><g fill={ink}><circle cx="138" cy="45" r="3" /><circle cx="149" cy="45" r="3" /><circle cx="160" cy="45" r="3" /></g>
      <g stroke={ink} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        {category === 'images' ? <><rect x="147" y="79" width="106" height="76" rx="7" /><circle cx="224" cy="97" r="8" /><path d="m149 144 29-32 26 22 16-13 31 29" /></> : category === 'coding' ? <><path d="m177 93-23 23 23 23m46-46 23 23-23 23m-17-58-15 71" /></> : category === 'design' ? <><circle cx="183" cy="111" r="27" /><rect x="194" y="110" width="43" height="43" rx="4" /><path d="m225 77 20 25h-40Z" /></> : category === 'home' ? <><path d="m156 110 44-34 44 34M165 107v48h70v-48m-45 48v-29h20v29" /></> : category === 'cooking' ? <><path d="M158 116h84a42 38 0 0 1-84 0Zm12 44h60m-47-58c-15-15 15-17 0-32m18 32c-15-15 15-17 0-32m18 32c-15-15 15-17 0-32" /></> : category === 'money' ? <><path d="M157 150V95m28 55v-31m28 31V98m28 52V78M153 91l31 12 30-26 28-12" /></> : <><path d="M171 89h62M171 111h62M171 133h39m-62-46 4 4 7-9m-11 27 4 4 7-9m-11 27 4 4 7-9" /></>}
      </g>
    </g>
    <g className="guide-art-check"><circle cx="284" cy="156" r="23" fill={ink} /><path d="m274 156 7 7 14-15" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></g>
    <path d="M91 59v16m-8-8h16M311 94v12m-6-6h12" stroke={ink} strokeWidth="2" />
  </svg>;
}
