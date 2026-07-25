export default function SymbolicExec() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Symbolic Execution diagram">
      <style>{`
        @keyframes traverse {
          0%,5%   { transform: translate(0,0); }
          18%,22% { transform: translate(-55px, 35px); }
          35%,39% { transform: translate(-85px, 70px); }
          52%,56% { transform: translate(0, 35px); }
          68%,72% { transform: translate(25px, 70px); }
          85%,90% { transform: translate(55px, 35px); }
          100%    { transform: translate(0,0); }
        }
        @keyframes leafCheck {
          0%,60%  { opacity: 0; }
          75%,100%{ opacity: 1; }
        }
        @keyframes pathGlow {
          0%,10%  { stroke: #334155; }
          25%,40% { stroke: #8b5cf6; }
          55%,70% { stroke: #8b5cf6; }
          80%,100%{ stroke: #334155; }
        }
        @keyframes robotBlink {
          0%,45%  { opacity: 1; }
          50%,55% { opacity: 0.3; }
          60%,100%{ opacity: 1; }
        }
        .robot    { animation: traverse 5s ease-in-out infinite; transform-origin: 190px 60px; }
        .leaves   { animation: leafCheck 5s ease-in-out infinite; }
        .path-l   { animation: pathGlow 5s ease-in-out infinite; }
        .robot-ic { animation: robotBlink 5s ease-in-out infinite; }
      `}</style>

      <rect width="380" height="220" fill="#0f172a" rx="10"/>

      {/* Tree structure */}
      {/* Root */}
      <circle cx="190" cy="58" r="18" fill="#1e293b" stroke="#8b5cf6" strokeWidth="1.5"/>
      <text x="190" y="54" textAnchor="middle" fill="#c4b5fd" fontSize="7" fontFamily="monospace">a &gt; 0?</text>
      <text x="190" y="65" textAnchor="middle" fill="#475569" fontSize="6" fontFamily="monospace">branch</text>

      {/* Left subtree */}
      <line x1="176" y1="74" x2="130" y2="100" stroke="#334155" strokeWidth="1.5" className="path-l"/>
      <circle cx="120" cy="110" r="16" fill="#1e293b" stroke="#8b5cf6" strokeWidth="1.5"/>
      <text x="120" y="106" textAnchor="middle" fill="#c4b5fd" fontSize="7" fontFamily="monospace">b &gt; 0?</text>
      <text x="120" y="116" textAnchor="middle" fill="#475569" fontSize="6" fontFamily="monospace">branch</text>

      <line x1="108" y1="124" x2="85"  y2="155" stroke="#334155" strokeWidth="1.5"/>
      <line x1="132" y1="124" x2="155" y2="155" stroke="#334155" strokeWidth="1.5"/>

      {/* Right subtree */}
      <line x1="204" y1="74" x2="250" y2="100" stroke="#334155" strokeWidth="1.5"/>
      <circle cx="260" cy="110" r="16" fill="#1e293b" stroke="#8b5cf6" strokeWidth="1.5"/>
      <text x="260" y="106" textAnchor="middle" fill="#c4b5fd" fontSize="7" fontFamily="monospace">b &gt; 0?</text>
      <text x="260" y="116" textAnchor="middle" fill="#475569" fontSize="6" fontFamily="monospace">branch</text>

      <line x1="248" y1="124" x2="220" y2="155" stroke="#334155" strokeWidth="1.5"/>
      <line x1="272" y1="124" x2="300" y2="155" stroke="#334155" strokeWidth="1.5"/>

      {/* Leaf nodes */}
      <g className="leaves">
        <rect x="68"  y="155" width="34" height="22" rx="4" fill="#052e16" stroke="#4ade80" strokeWidth="1"/>
        <text x="85"  y="170" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="monospace">✓</text>

        <rect x="138" y="155" width="34" height="22" rx="4" fill="#052e16" stroke="#4ade80" strokeWidth="1"/>
        <text x="155" y="170" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="monospace">✓</text>

        <rect x="203" y="155" width="34" height="22" rx="4" fill="#052e16" stroke="#4ade80" strokeWidth="1"/>
        <text x="220" y="170" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="monospace">✓</text>

        <rect x="283" y="155" width="34" height="22" rx="4" fill="#052e16" stroke="#4ade80" strokeWidth="1"/>
        <text x="300" y="170" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="monospace">✓</text>
      </g>

      {/* Property label */}
      <rect x="20" y="188" width="340" height="18" rx="4" fill="#0d1117" stroke="#21262d" strokeWidth="1"/>
      <text x="190" y="201" textAnchor="middle" fill="#8b5cf6" fontSize="8" fontFamily="monospace">property: ∀a,b ∈ uint256 → add(a,b) never overflows  [SMT proved]</text>

      {/* Robot traverser */}
      <g className="robot">
        <circle cx="190" cy="58" r="10" fill="#7c3aed" opacity="0.9" className="robot-ic"/>
        <text x="190" y="63" textAnchor="middle" fill="white" fontSize="10" className="robot-ic">🤖</text>
      </g>

      <text x="190" y="25" textAnchor="middle" fill="#f97316" fontSize="13" fontWeight="bold" fontFamily="sans-serif">Symbolic Execution</text>
      <text x="190" y="40" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="sans-serif">all paths explored simultaneously — SMT solver proves property</text>
    </svg>
  );
}
