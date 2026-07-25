export default function HashChain() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hash Chain tamper detection diagram">
      <style>{`
        @keyframes tamperFlash {
          0%, 49%  { fill: #1e293b; stroke: #334155; }
          50%, 70% { fill: #450a0a; stroke: #ef4444; }
          71%, 100% { fill: #1e293b; stroke: #334155; }
        }
        @keyframes hashRed {
          0%, 49%  { fill: #4ade80; }
          50%, 70% { fill: #ef4444; }
          71%, 100% { fill: #4ade80; }
        }
        @keyframes prevHashMismatch {
          0%, 55%  { fill: #60a5fa; }
          56%, 75% { fill: #ef4444; }
          76%, 100% { fill: #60a5fa; }
        }
        @keyframes chainBreak {
          0%, 54%  { opacity: 1; stroke: #60a5fa; }
          55%, 74% { opacity: 0.3; stroke: #ef4444; stroke-dasharray: 4,4; }
          75%, 100% { opacity: 1; stroke: #60a5fa; }
        }
        @keyframes warnPulse {
          0%, 49%  { opacity: 0; }
          50%, 70% { opacity: 1; }
          71%, 100% { opacity: 0; }
        }
        .block2-bg { animation: tamperFlash 4s ease-in-out infinite; }
        .hash-b2   { animation: hashRed 4s ease-in-out infinite; }
        .prevhash-b3 { animation: prevHashMismatch 4s ease-in-out infinite; }
        .chain-b2b3  { animation: chainBreak 4s ease-in-out infinite; }
        .warn        { animation: warnPulse 4s ease-in-out infinite; }
      `}</style>

      {/* Block 1 — valid */}
      <rect x="10" y="55" width="100" height="110" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
      <text x="60" y="74" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="monospace">Block #1</text>
      <text x="18" y="90" fill="#64748b" fontSize="7" fontFamily="monospace">prevHash:</text>
      <text x="18" y="100" fill="#60a5fa" fontSize="6" fontFamily="monospace">0000...0000</text>
      <text x="18" y="116" fill="#64748b" fontSize="7" fontFamily="monospace">data: genesis</text>
      <text x="18" y="133" fill="#64748b" fontSize="7" fontFamily="monospace">hash:</text>
      <text x="18" y="143" fill="#4ade80" fontSize="6" fontFamily="monospace">a1b2c3d4...</text>

      {/* Arrow B1→B2 */}
      <line x1="112" y1="110" x2="128" y2="110" stroke="#60a5fa" strokeWidth="1.5"/>
      <polygon points="128,105 136,110 128,115" fill="#60a5fa"/>

      {/* Block 2 — tampered */}
      <rect x="135" y="55" width="110" height="110" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" className="block2-bg"/>
      <text x="190" y="74" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="monospace">Block #2</text>
      <text x="143" y="90" fill="#64748b" fontSize="7" fontFamily="monospace">prevHash:</text>
      <text x="143" y="100" fill="#60a5fa" fontSize="6" fontFamily="monospace">a1b2c3d4...</text>
      <text x="143" y="116" fill="#64748b" fontSize="7" fontFamily="monospace">data: TAMPERED</text>
      <text x="143" y="133" fill="#64748b" fontSize="7" fontFamily="monospace">hash:</text>
      <text x="143" y="143" fontSize="6" fontFamily="monospace" className="hash-b2">f9e8d7c6...</text>

      {/* Tamper warning badge */}
      <g className="warn">
        <rect x="145" y="155" width="90" height="14" rx="3" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1"/>
        <text x="190" y="165" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace">⚠ TAMPERED</text>
      </g>

      {/* Arrow B2→B3 — breaks */}
      <line x1="247" y1="110" x2="263" y2="110" stroke="#60a5fa" strokeWidth="1.5" className="chain-b2b3"/>
      <polygon points="263,105 271,110 263,115" fill="#60a5fa" className="chain-b2b3"/>

      {/* Block 3 — now invalid */}
      <rect x="270" y="55" width="100" height="110" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
      <text x="320" y="74" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="monospace">Block #3</text>
      <text x="278" y="90" fill="#64748b" fontSize="7" fontFamily="monospace">prevHash:</text>
      <text x="278" y="100" fontSize="6" fontFamily="monospace" className="prevhash-b3">f9e8d7c6...</text>
      <text x="278" y="116" fill="#64748b" fontSize="7" fontFamily="monospace">data: txns...</text>
      <text x="278" y="133" fill="#64748b" fontSize="7" fontFamily="monospace">hash:</text>
      <text x="278" y="143" fill="#4ade80" fontSize="6" fontFamily="monospace">3c4d5e6f...</text>

      {/* Title + subtitle */}
      <text x="190" y="20" textAnchor="middle" fill="#60a5fa" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Hash Chain Integrity</text>
      <text x="190" y="208" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="sans-serif">Tampering block 2 breaks the chain at block 3</text>
    </svg>
  );
}
