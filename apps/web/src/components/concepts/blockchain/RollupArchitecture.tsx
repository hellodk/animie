export default function RollupArchitecture() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Rollup architecture diagram">
      <style>{`
        @keyframes dotCollect {
          0%          { opacity: 0; transform: translateX(0) translateY(0); }
          10%, 30%    { opacity: 1; transform: translateX(0) translateY(0); }
          50%         { opacity: 1; transform: translateX(20px) translateY(-15px); }
          60%, 100%   { opacity: 0; transform: translateX(20px) translateY(-15px); }
        }
        @keyframes dotCollect2 {
          0%, 10%     { opacity: 0; }
          20%, 40%    { opacity: 1; transform: translateX(0) translateY(0); }
          55%         { opacity: 1; transform: translateX(15px) translateY(-20px); }
          65%, 100%   { opacity: 0; }
        }
        @keyframes dotCollect3 {
          0%, 20%     { opacity: 0; }
          30%, 50%    { opacity: 1; transform: translateX(0) translateY(0); }
          60%         { opacity: 1; transform: translateX(25px) translateY(-10px); }
          70%, 100%   { opacity: 0; }
        }
        @keyframes batchCompress {
          0%, 55%  { opacity: 0; }
          60%, 80% { opacity: 1; }
          90%, 100% { opacity: 0; }
        }
        @keyframes submitArrow {
          0%, 65%  { stroke-dashoffset: 60; opacity: 0; }
          75%, 90% { stroke-dashoffset: 0; opacity: 1; }
          100%     { stroke-dashoffset: 60; opacity: 0; }
        }
        @keyframes l1Accept {
          0%, 85%  { stroke: #334155; fill: #0f172a; }
          86%, 100% { stroke: #4ade80; fill: #0a1f0a; }
        }
        @keyframes costSave {
          0%, 74%  { opacity: 0; }
          75%, 100% { opacity: 1; }
        }
        .d1 { animation: dotCollect 5s ease-in-out infinite; transform-origin: 0 0; }
        .d2 { animation: dotCollect2 5s ease-in-out infinite; transform-origin: 0 0; }
        .d3 { animation: dotCollect3 5s ease-in-out infinite; transform-origin: 0 0; }
        .batch { animation: batchCompress 5s ease-in-out infinite; }
        .sub-arr { stroke-dasharray: 60; animation: submitArrow 5s ease-in-out infinite; }
        .l1-box  { animation: l1Accept 5s ease-in-out infinite; }
        .saving  { animation: costSave 5s ease-in-out infinite; }
      `}</style>

      {/* L2 side */}
      <rect x="10" y="40" width="160" height="145" rx="8" fill="#0f172a" stroke="#6366f1" strokeWidth="1.5"/>
      <text x="90" y="30" textAnchor="middle" fill="#818cf8" fontSize="10" fontWeight="bold" fontFamily="monospace">L2 Chain</text>

      {/* L2 transactions as dots */}
      <text x="20" y="60" fill="#94a3b8" fontSize="8" fontFamily="monospace">Pending txns:</text>
      <g className="d1">
        <circle cx="25" cy="80" r="5" fill="#6366f1" opacity="0.9"/>
        <text x="25" y="83" textAnchor="middle" fill="white" fontSize="5">tx</text>
      </g>
      <g className="d2">
        <circle cx="50" cy="80" r="5" fill="#6366f1" opacity="0.9"/>
        <text x="50" y="83" textAnchor="middle" fill="white" fontSize="5">tx</text>
      </g>
      <g className="d3">
        <circle cx="75" cy="80" r="5" fill="#6366f1" opacity="0.9"/>
        <text x="75" y="83" textAnchor="middle" fill="white" fontSize="5">tx</text>
      </g>
      <circle cx="100" cy="80" r="5" fill="#6366f1" opacity="0.5"/>
      <circle cx="125" cy="80" r="5" fill="#6366f1" opacity="0.5"/>
      <circle cx="150" cy="80" r="5" fill="#6366f1" opacity="0.3"/>

      {/* Sequencer */}
      <rect x="20" y="100" width="140" height="30" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1"/>
      <text x="90" y="119" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">Sequencer: collect + order</text>

      {/* Compressed batch box */}
      <g className="batch">
        <rect x="20" y="143" width="140" height="30" rx="4" fill="#1e1f4e" stroke="#818cf8" strokeWidth="1.5"/>
        <text x="90" y="158" textAnchor="middle" fill="#c7d2fe" fontSize="7.5" fontFamily="monospace">Batch: 500 txns compressed</text>
        <text x="90" y="169" textAnchor="middle" fill="#818cf8" fontSize="7" fontFamily="monospace">state root: 0xa3f2...</text>
      </g>

      {/* Submit arrow L2→L1 */}
      <line x1="172" y1="130" x2="208" y2="130" stroke="#4ade80" strokeWidth="2" className="sub-arr"/>
      <polygon points="208,125 216,130 208,135" fill="#4ade80"/>
      <text x="190" y="120" textAnchor="middle" fill="#4ade80" fontSize="7.5" fontFamily="monospace">submit</text>

      {/* L1 side */}
      <rect x="215" y="40" width="155" height="145" rx="8" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" className="l1-box"/>
      <text x="292" y="30" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="monospace">L1 Chain</text>

      {/* L1 rollup contract */}
      <rect x="225" y="58" width="135" height="55" rx="4" fill="#1e293b" stroke="#f59e0b" strokeWidth="1"/>
      <text x="292" y="75" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold" fontFamily="monospace">Rollup Contract</text>
      <text x="292" y="89" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">stores: state root</text>
      <text x="292" y="101" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">fraud window: 7 days</text>

      {/* L1 block visual */}
      <rect x="225" y="125" width="60" height="35" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1"/>
      <text x="255" y="140" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">L1 Block</text>
      <text x="255" y="153" textAnchor="middle" fill="#475569" fontSize="6" fontFamily="monospace">calldata only</text>

      {/* Cost saving label */}
      <g className="saving">
        <rect x="295" y="125" width="75" height="35" rx="4" fill="#14532d" stroke="#4ade80" strokeWidth="1"/>
        <text x="332" y="140" textAnchor="middle" fill="#4ade80" fontSize="8" fontFamily="monospace">~10-100x</text>
        <text x="332" y="152" textAnchor="middle" fill="#86efac" fontSize="7" fontFamily="monospace">cost savings</text>
      </g>

      {/* Title + subtitle */}
      <text x="190" y="15" textAnchor="middle" fill="#818cf8" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Rollup Architecture</text>
      <text x="190" y="200" textAnchor="middle" fill="#64748b" fontSize="8.5" fontFamily="sans-serif">L2 batches txns → submits state root to L1</text>
    </svg>
  );
}
