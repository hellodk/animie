export default function InvariantTesting() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Invariant Testing diagram">
      <style>{`
        @keyframes stateMove {
          0%,10%  { transform: translateX(0); }
          30%,40% { transform: translateX(92px); }
          60%,70% { transform: translateX(0); }
          85%,90% { transform: translateX(52px) translateY(-30px); }
          100%    { transform: translateX(0); }
        }
        @keyframes invariantOk {
          0%,75%  { fill: #4ade80; opacity: 1; }
          80%,90% { fill: #ef4444; opacity: 1; }
          92%     { fill: #ef4444; opacity: 0.3; }
          94%     { fill: #ef4444; opacity: 1; }
          96%     { fill: #ef4444; opacity: 0.3; }
          100%    { fill: #4ade80; opacity: 1; }
        }
        @keyframes badTransArrow {
          0%,75%  { opacity: 0; }
          80%,95% { opacity: 1; }
          100%    { opacity: 0; }
        }
        @keyframes invariantBorder {
          0%,75%  { stroke: #4ade80; }
          80%,95% { stroke: #ef4444; }
          100%    { stroke: #4ade80; }
        }
        .state-dot { animation: stateMove 5s ease-in-out infinite; }
        .inv-label { animation: invariantOk 5s ease-in-out infinite; }
        .bad-arrow { animation: badTransArrow 5s ease-in-out infinite; }
        .inv-box   { animation: invariantBorder 5s ease-in-out infinite; }
      `}</style>

      <rect width="380" height="220" fill="#0f172a" rx="10"/>

      {/* State nodes */}
      <circle cx="70"  cy="130" r="28" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
      <text x="70"  y="126" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">S0</text>
      <text x="70"  y="138" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="monospace">mint()</text>

      <circle cx="185" cy="130" r="28" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
      <text x="185" y="126" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">S1</text>
      <text x="185" y="138" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="monospace">burn()</text>

      <circle cx="300" cy="130" r="28" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
      <text x="300" y="126" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">S2</text>
      <text x="300" y="138" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="monospace">transfer()</text>

      {/* Normal transition arrows */}
      <line x1="98" y1="130" x2="155" y2="130" stroke="#475569" strokeWidth="1.5"/>
      <polygon points="155,125 163,130 155,135" fill="#475569"/>
      <line x1="213" y1="130" x2="270" y2="130" stroke="#475569" strokeWidth="1.5"/>
      <polygon points="270,125 278,130 270,135" fill="#475569"/>

      {/* Bad transition arrow (diagonal bad path) */}
      <g className="bad-arrow">
        <path d="M 98 120 Q 150 60 260 120" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="5,3"/>
        <polygon points="255,115 266,122 259,130" fill="#ef4444"/>
        <text x="170" y="68" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace">BAD transition</text>
      </g>

      {/* Invariant label box */}
      <rect x="100" y="42" width="180" height="28" rx="6" fill="#052e16" className="inv-box" strokeWidth="1.5"/>
      <text x="190" y="52" textAnchor="middle" fontSize="8" fontFamily="monospace" className="inv-label">invariant: totalSupply == sum(balances)</text>
      <text x="190" y="63" textAnchor="middle" fill="#4ade80" fontSize="7" fontFamily="monospace" className="inv-label">⚖ checked after every call</text>

      {/* Animated state indicator */}
      <g className="state-dot" style={{ transformOrigin: '70px 90px' }}>
        <circle cx="70" cy="90" r="7" fill="#f97316" opacity="0.9"/>
        <text x="70" y="94" textAnchor="middle" fill="white" fontSize="9">●</text>
      </g>

      <text x="190" y="25" textAnchor="middle" fill="#f97316" fontSize="13" fontWeight="bold" fontFamily="sans-serif">Invariant Testing</text>
    </svg>
  );
}
