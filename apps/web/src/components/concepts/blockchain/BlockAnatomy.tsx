export default function BlockAnatomy() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Block Anatomy diagram">
      <style>{`
        @keyframes fieldLight1 {
          0%, 10%  { fill: #1e293b; }
          15%, 35% { fill: #1e3a5f; }
          100%     { fill: #1e293b; }
        }
        @keyframes fieldLight2 {
          0%, 25%  { fill: #1e293b; }
          30%, 50% { fill: #14532d; }
          100%     { fill: #1e293b; }
        }
        @keyframes fieldLight3 {
          0%, 40%  { fill: #1e293b; }
          45%, 65% { fill: #3b1f5e; }
          100%     { fill: #1e293b; }
        }
        @keyframes hashGlow {
          0%, 55%  { filter: none; opacity: 0.7; }
          60%, 80% { filter: drop-shadow(0 0 4px #facc15); opacity: 1; }
          100%     { filter: none; opacity: 0.7; }
        }
        @keyframes gearSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes arrowDraw {
          0%, 5%   { stroke-dashoffset: 40; opacity: 0; }
          20%, 100% { stroke-dashoffset: 0; opacity: 1; }
        }
        .field1  { animation: fieldLight1 5s ease-in-out infinite; }
        .field2  { animation: fieldLight2 5s ease-in-out infinite; }
        .field3  { animation: fieldLight3 5s ease-in-out infinite; }
        .hash-g  { animation: hashGlow 5s ease-in-out infinite; }
        .gear    { animation: gearSpin 3s linear infinite; transform-origin: 322px 80px; }
        .arr     { stroke-dasharray: 40; animation: arrowDraw 5s ease-in-out infinite; }
      `}</style>

      {/* Previous block (ghost) */}
      <rect x="10" y="50" width="90" height="120" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" strokeDasharray="4,3"/>
      <text x="55" y="75" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace">prev block</text>
      <text x="55" y="95" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="monospace">hash:</text>
      <text x="55" y="107" textAnchor="middle" fill="#475569" fontSize="6" fontFamily="monospace">a1b2c3d4...</text>

      {/* Arrow from prev block hash to prevHash field */}
      <line x1="100" y1="105" x2="128" y2="105" stroke="#60a5fa" strokeWidth="1.5" className="arr"/>
      <polygon points="128,100 136,105 128,110" fill="#60a5fa" opacity="0.8"/>

      {/* Main block box */}
      <rect x="135" y="30" width="160" height="160" rx="8" fill="#1e293b" stroke="#60a5fa" strokeWidth="2"/>
      <text x="215" y="52" textAnchor="middle" fill="#60a5fa" fontSize="11" fontWeight="bold" fontFamily="monospace">Block #1</text>

      {/* prevHash field */}
      <rect x="145" y="60" width="140" height="24" rx="4" className="field1"/>
      <text x="153" y="73" fill="#94a3b8" fontSize="8" fontFamily="monospace">prevHash:</text>
      <text x="153" y="83" fill="#60a5fa" fontSize="6.5" fontFamily="monospace">a1b2c3d4e5f6...</text>

      {/* nonce field with gear */}
      <rect x="145" y="90" width="140" height="24" rx="4" className="field3"/>
      <text x="153" y="103" fill="#94a3b8" fontSize="8" fontFamily="monospace">nonce:</text>
      <text x="153" y="113" fill="#c084fc" fontSize="8" fontFamily="monospace">142057</text>
      <g className="gear">
        <text x="315" y="84" textAnchor="middle" fill="#c084fc" fontSize="14">⚙</text>
      </g>

      {/* transactions field */}
      <rect x="145" y="120" width="140" height="36" rx="4" className="field2"/>
      <text x="153" y="133" fill="#94a3b8" fontSize="8" fontFamily="monospace">transactions:</text>
      <text x="153" y="144" fill="#4ade80" fontSize="6.5" fontFamily="monospace">Alice→Bob 1.5 ETH</text>
      <text x="153" y="153" fill="#4ade80" fontSize="6.5" fontFamily="monospace">Bob→Carol 0.5 ETH</text>

      {/* hash field — glowing */}
      <g className="hash-g">
        <rect x="145" y="162" width="140" height="20" rx="4" fill="#1c1917" stroke="#facc15" strokeWidth="1"/>
        <text x="153" y="174" fill="#94a3b8" fontSize="8" fontFamily="monospace">hash:</text>
        <text x="153" y="175" fill="#facc15" fontSize="6" fontFamily="monospace" dy="8">f9e8d7c6b5a4...</text>
      </g>

      {/* Title */}
      <text x="190" y="17" textAnchor="middle" fill="#60a5fa" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Block Anatomy</text>
      <text x="190" y="207" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="sans-serif">Fields light up as you inspect each one</text>
    </svg>
  );
}
