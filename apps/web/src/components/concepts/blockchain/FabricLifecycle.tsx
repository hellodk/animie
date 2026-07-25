export default function FabricLifecycle() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hyperledger Fabric chaincode lifecycle diagram">
      <style>{`
        @keyframes stepLight1 {
          0%, 5%   { fill: #1e293b; stroke: #334155; }
          10%, 30% { fill: #1e3a5f; stroke: #60a5fa; }
          100%     { fill: #1e293b; stroke: #334155; }
        }
        @keyframes stepLight2 {
          0%, 25%  { fill: #1e293b; stroke: #334155; }
          30%, 50% { fill: #1c3a2e; stroke: #4ade80; }
          100%     { fill: #1e293b; stroke: #334155; }
        }
        @keyframes stepLight3 {
          0%, 45%  { fill: #1e293b; stroke: #334155; }
          50%, 70% { fill: #2d1f5e; stroke: #a78bfa; }
          100%     { fill: #1e293b; stroke: #334155; }
        }
        @keyframes stepLight4 {
          0%, 65%  { fill: #1e293b; stroke: #334155; }
          70%, 90% { fill: #1c2f1e; stroke: #4ade80; }
          100%     { fill: #1e293b; stroke: #334155; }
        }
        @keyframes arrDraw1 {
          0%, 10%  { stroke-dashoffset: 30; opacity: 0; }
          25%, 100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes arrDraw2 {
          0%, 30%  { stroke-dashoffset: 30; opacity: 0; }
          45%, 100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes arrDraw3 {
          0%, 50%  { stroke-dashoffset: 30; opacity: 0; }
          65%, 100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes commitPulse {
          0%, 89%  { opacity: 0; }
          90%, 100% { opacity: 1; }
        }
        @keyframes ordererGlow {
          0%, 68%  { fill: #1e293b; stroke: #f59e0b; }
          70%, 90% { fill: #2a2000; stroke: #fde68a; }
          100%     { fill: #1e293b; stroke: #f59e0b; }
        }
        @keyframes ordererArrow {
          0%, 68%  { stroke-dashoffset: 45; opacity: 0; }
          72%, 90% { stroke-dashoffset: 0; opacity: 1; }
          95%, 100% { stroke-dashoffset: 45; opacity: 0; }
        }
        .s1 { animation: stepLight1 6s ease-in-out infinite; }
        .s2 { animation: stepLight2 6s ease-in-out infinite; }
        .s3 { animation: stepLight3 6s ease-in-out infinite; }
        .s4 { animation: stepLight4 6s ease-in-out infinite; }
        .a1 { stroke-dasharray: 30; animation: arrDraw1 6s ease-in-out infinite; }
        .a2 { stroke-dasharray: 30; animation: arrDraw2 6s ease-in-out infinite; }
        .a3 { stroke-dasharray: 30; animation: arrDraw3 6s ease-in-out infinite; }
        .commit-badge { animation: commitPulse 6s ease-in-out infinite; }
        .orderer-node { animation: ordererGlow 6s ease-in-out infinite; }
        .orderer-arr  { stroke-dasharray: 45; animation: ordererArrow 6s ease-in-out infinite; }
      `}</style>

      {/* Step 1: Package */}
      <rect x="10" y="55" width="75" height="70" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" className="s1"/>
      <text x="47" y="79" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="monospace">①</text>
      <text x="47" y="92" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">Package</text>
      <text x="47" y="105" textAnchor="middle" fontSize="16">📦</text>
      <text x="47" y="120" textAnchor="middle" fill="#64748b" fontSize="6.5" fontFamily="monospace">.tar.gz</text>

      {/* Arrow 1→2 */}
      <line x1="87" y1="90" x2="103" y2="90" stroke="#60a5fa" strokeWidth="1.5" className="a1"/>
      <polygon points="103,85 111,90 103,95" fill="#60a5fa"/>

      {/* Step 2: Install */}
      <rect x="110" y="55" width="75" height="70" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" className="s2"/>
      <text x="147" y="79" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="monospace">②</text>
      <text x="147" y="92" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">Install</text>
      <text x="133" y="108" fill="#4ade80" fontSize="10">🖥</text>
      <text x="153" y="108" fill="#4ade80" fontSize="10">🖥</text>
      <text x="147" y="121" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="monospace">Org1 + Org2</text>

      {/* Arrow 2→3 */}
      <line x1="187" y1="90" x2="203" y2="90" stroke="#4ade80" strokeWidth="1.5" className="a2"/>
      <polygon points="203,85 211,90 203,95" fill="#4ade80"/>

      {/* Step 3: Approve */}
      <rect x="210" y="55" width="75" height="70" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" className="s3"/>
      <text x="247" y="79" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="monospace">③</text>
      <text x="247" y="92" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">Approve</text>
      <text x="228" y="108" fill="#a78bfa" fontSize="8" fontFamily="monospace">Org1 ✓</text>
      <text x="228" y="120" fill="#a78bfa" fontSize="8" fontFamily="monospace">Org2 ✓</text>

      {/* Arrow 3→4 */}
      <line x1="287" y1="90" x2="303" y2="90" stroke="#a78bfa" strokeWidth="1.5" className="a3"/>
      <polygon points="303,85 311,90 303,95" fill="#a78bfa"/>

      {/* Step 4: Commit */}
      <rect x="310" y="55" width="62" height="70" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" className="s4"/>
      <text x="341" y="79" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="monospace">④</text>
      <text x="341" y="92" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">Commit</text>
      <text x="341" y="107" textAnchor="middle" fontSize="16">⛓</text>
      <text x="341" y="120" textAnchor="middle" fill="#64748b" fontSize="6.5" fontFamily="monospace">channel</text>

      {/* Commit success badge */}
      <g className="commit-badge">
        <rect x="280" y="140" width="92" height="18" rx="4" fill="#14532d" stroke="#4ade80" strokeWidth="1"/>
        <text x="326" y="152" textAnchor="middle" fill="#4ade80" fontSize="8" fontFamily="monospace">✓ Chaincode Live</text>
      </g>

      {/* Orderer node */}
      <rect x="130" y="172" width="120" height="30" rx="6" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" className="orderer-node"/>
      <text x="190" y="187" textAnchor="middle" fill="#f59e0b" fontSize="8" fontFamily="monospace">Orderer (Raft)</text>
      <text x="190" y="197" textAnchor="middle" fill="#78716c" fontSize="6" fontFamily="monospace">broadcasts committed tx to all peers</text>

      {/* Dashed arrow: Commit step → Orderer */}
      <path d="M 341 127 Q 341 160 250 172" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,3" className="orderer-arr"/>
      <polygon points="247,169 248,178 255,172" fill="#f59e0b"/>
      <text x="320" y="157" fill="#f59e0b" fontSize="6.5" fontFamily="monospace">submits to</text>
      <text x="320" y="166" fill="#f59e0b" fontSize="6.5" fontFamily="monospace">orderer</text>

      {/* Title */}
      <text x="190" y="16" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Fabric Chaincode Lifecycle</text>
      <text x="190" y="31" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="sans-serif">Package → Install → Approve (each org) → Commit</text>
      <text x="190" y="45" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace">Steps light up in sequence</text>
    </svg>
  );
}
