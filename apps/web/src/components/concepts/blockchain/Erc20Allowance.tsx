export default function Erc20Allowance() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ERC-20 Allowance flow diagram">
      <style>{`
        @keyframes drawArr1 {
          0%, 5%   { stroke-dashoffset: 60; opacity: 0; }
          20%, 100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes drawArr2 {
          0%, 30%  { stroke-dashoffset: 90; opacity: 0; }
          50%, 100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes drawArr3 {
          0%, 55%  { stroke-dashoffset: 90; opacity: 0; }
          75%, 100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes fadeLabel1 {
          0%, 5%   { opacity: 0; }
          20%, 100% { opacity: 1; }
        }
        @keyframes fadeLabel2 {
          0%, 30%  { opacity: 0; }
          50%, 100% { opacity: 1; }
        }
        @keyframes fadeLabel3 {
          0%, 55%  { opacity: 0; }
          75%, 100% { opacity: 1; }
        }
        @keyframes checkMark {
          0%, 74%  { opacity: 0; }
          75%, 100% { opacity: 1; }
        }
        .arr1 { stroke-dasharray: 60; animation: drawArr1 5s ease-in-out infinite; }
        .arr2 { stroke-dasharray: 90; animation: drawArr2 5s ease-in-out infinite; }
        .arr3 { stroke-dasharray: 90; animation: drawArr3 5s ease-in-out infinite; }
        .lbl1 { animation: fadeLabel1 5s ease-in-out infinite; }
        .lbl2 { animation: fadeLabel2 5s ease-in-out infinite; }
        .lbl3 { animation: fadeLabel3 5s ease-in-out infinite; }
        .check { animation: checkMark 5s ease-in-out infinite; }
      `}</style>

      {/* Owner box */}
      <rect x="10" y="80" width="80" height="50" rx="6" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.5"/>
      <text x="50" y="101" textAnchor="middle" fill="#60a5fa" fontSize="9" fontWeight="bold" fontFamily="monospace">Owner</text>
      <text x="50" y="115" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">1000 QUEST</text>
      <text x="50" y="126" textAnchor="middle" fill="#64748b" fontSize="6.5" fontFamily="monospace">0xOwner</text>

      {/* Spender box */}
      <rect x="150" y="80" width="80" height="50" rx="6" fill="#1e293b" stroke="#a78bfa" strokeWidth="1.5"/>
      <text x="190" y="101" textAnchor="middle" fill="#a78bfa" fontSize="9" fontWeight="bold" fontFamily="monospace">Spender</text>
      <text x="190" y="115" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">DEX Contract</text>
      <text x="190" y="126" textAnchor="middle" fill="#64748b" fontSize="6.5" fontFamily="monospace">0xDEX</text>

      {/* Recipient box */}
      <rect x="290" y="80" width="80" height="50" rx="6" fill="#1e293b" stroke="#4ade80" strokeWidth="1.5"/>
      <text x="330" y="101" textAnchor="middle" fill="#4ade80" fontSize="9" fontWeight="bold" fontFamily="monospace">Recipient</text>
      <text x="330" y="115" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">Buyer</text>
      <text x="330" y="126" textAnchor="middle" fill="#64748b" fontSize="6.5" fontFamily="monospace">0xBuyer</text>

      {/* Step 1: approve arrow Owner→Spender */}
      <line x1="92" y1="97" x2="148" y2="97" stroke="#f59e0b" strokeWidth="1.5" className="arr1"/>
      <polygon points="148,92 156,97 148,102" fill="#f59e0b"/>
      <g className="lbl1">
        <text x="120" y="91" textAnchor="middle" fill="#f59e0b" fontSize="7.5" fontFamily="monospace">① approve</text>
        <text x="120" y="73" textAnchor="middle" fill="#64748b" fontSize="6.5" fontFamily="monospace">(DEX, 500)</text>
      </g>

      {/* Step 2: transferFrom arrow Spender→Owner (pull from) */}
      <path d="M 190 132 Q 190 165 50 165 Q 50 132 50 130" fill="none" stroke="#a78bfa" strokeWidth="1.5" className="arr2"/>
      <polygon points="50,130 44,140 56,140" fill="#a78bfa"/>
      <g className="lbl2">
        <text x="130" y="178" textAnchor="middle" fill="#a78bfa" fontSize="7.5" fontFamily="monospace">② transferFrom</text>
        <text x="130" y="190" textAnchor="middle" fill="#64748b" fontSize="6.5" fontFamily="monospace">(Owner→Buyer, 500)</text>
      </g>

      {/* Step 3: tokens flow to recipient */}
      <line x1="232" y1="115" x2="288" y2="115" stroke="#4ade80" strokeWidth="1.5" className="arr3"/>
      <polygon points="288,110 296,115 288,120" fill="#4ade80"/>
      <g className="lbl3">
        <text x="260" y="133" textAnchor="middle" fill="#4ade80" fontSize="7" fontFamily="monospace">③ 500 QUEST</text>
      </g>

      {/* Success check */}
      <g className="check">
        <rect x="150" y="40" width="80" height="20" rx="4" fill="#14532d" stroke="#4ade80" strokeWidth="1"/>
        <text x="190" y="54" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="monospace">✓ Transfer OK</text>
      </g>

      {/* Title */}
      <text x="190" y="18" textAnchor="middle" fill="#818cf8" fontSize="12" fontWeight="bold" fontFamily="sans-serif">ERC-20 Allowance Flow</text>
      <text x="190" y="33" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="sans-serif">approve → transferFrom → recipient receives tokens</text>
    </svg>
  );
}
