export default function Erc20Token() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ERC-20 Token diagram">
      <style>{`
        @keyframes tokenMove {
          0%, 20%  { transform: translateX(0); opacity: 0; }
          30%, 45% { transform: translateX(0); opacity: 1; }
          70%      { transform: translateX(120px); opacity: 1; }
          80%, 100% { transform: translateX(120px); opacity: 0; }
        }
        @keyframes balFlash1 {
          0%, 60%  { fill: #4ade80; }
          65%, 80% { fill: #ef4444; }
          81%, 100% { fill: #4ade80; }
        }
        @keyframes balFlash2 {
          0%, 60%  { fill: #4ade80; }
          65%, 80% { fill: #86efac; }
          81%, 100% { fill: #4ade80; }
        }
        @keyframes fnHighlight {
          0%, 29%  { fill: #1e293b; }
          30%, 50% { fill: #1c3a2e; }
          51%, 100% { fill: #1e293b; }
        }
        .token-coin { animation: tokenMove 4s ease-in-out infinite; transform-origin: 0 0; }
        .bal1       { animation: balFlash1 4s ease-in-out infinite; }
        .bal2       { animation: balFlash2 4s ease-in-out infinite; }
        .fn-row     { animation: fnHighlight 4s ease-in-out infinite; }
      `}</style>

      {/* Contract box */}
      <rect x="130" y="25" width="120" height="100" rx="6" fill="#1e293b" stroke="#6366f1" strokeWidth="2"/>
      <text x="190" y="44" textAnchor="middle" fill="#818cf8" fontSize="10" fontWeight="bold" fontFamily="monospace">ERC-20 Token</text>
      <line x1="138" y1="50" x2="242" y2="50" stroke="#334155" strokeWidth="1"/>
      {/* Functions */}
      <rect x="138" y="54" width="104" height="14" rx="3" fill="#1e293b"/>
      <text x="146" y="64" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">totalSupply()</text>
      <text x="230" y="64" fill="#4ade80" fontSize="7" fontFamily="monospace">1M</text>
      <rect x="138" y="70" width="104" height="14" rx="3" className="fn-row"/>
      <text x="146" y="80" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">transfer(to, amt)</text>
      <rect x="138" y="86" width="104" height="14" rx="3" fill="#1e293b"/>
      <text x="146" y="96" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">balanceOf(addr)</text>
      <rect x="138" y="102" width="104" height="14" rx="3" fill="#1e293b"/>
      <text x="146" y="112" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">approve(spender)</text>

      {/* Wallet A */}
      <rect x="10" y="145" width="85" height="50" rx="6" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.5"/>
      <text x="52" y="163" textAnchor="middle" fill="#60a5fa" fontSize="9" fontFamily="monospace">Wallet A</text>
      <text x="52" y="177" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">balance:</text>
      <text x="52" y="188" textAnchor="middle" fontSize="10" fontFamily="monospace" className="bal1">500 QUEST</text>

      {/* Wallet B */}
      <rect x="285" y="145" width="85" height="50" rx="6" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.5"/>
      <text x="327" y="163" textAnchor="middle" fill="#60a5fa" fontSize="9" fontFamily="monospace">Wallet B</text>
      <text x="327" y="177" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">balance:</text>
      <text x="327" y="188" textAnchor="middle" fontSize="10" fontFamily="monospace" className="bal2">200 QUEST</text>

      {/* Animated token coin */}
      <g className="token-coin">
        <circle cx="95" cy="170" r="10" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5"/>
        <text x="95" y="174" textAnchor="middle" fill="#1e293b" fontSize="8" fontWeight="bold">Q</text>
      </g>

      {/* Transfer arrow label */}
      <text x="190" y="210" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="sans-serif">transfer() moves QUEST tokens from A to B</text>

      {/* Title */}
      <text x="190" y="15" textAnchor="middle" fill="#818cf8" fontSize="12" fontWeight="bold" fontFamily="sans-serif">ERC-20 Token Contract</text>
    </svg>
  );
}
