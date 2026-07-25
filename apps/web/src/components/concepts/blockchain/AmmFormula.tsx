export default function AmmFormula() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="AMM constant product formula diagram">
      <style>{`
        @keyframes swapArrow {
          0%, 15%  { stroke-dashoffset: 50; opacity: 0; }
          30%, 70% { stroke-dashoffset: 0; opacity: 1; }
          85%, 100% { stroke-dashoffset: 50; opacity: 0; }
        }
        @keyframes kPulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.08); }
        }
        .swap-arr { stroke-dasharray: 50; animation: swapArrow 5s ease-in-out infinite; }
        .k-label  { animation: kPulse 2.5s ease-in-out infinite; transform-origin: 190px 110px; }
      `}</style>

      {/* Pool container */}
      <rect x="80" y="50" width="220" height="130" rx="10" fill="#0f172a" stroke="#334155" strokeWidth="2"/>
      <text x="190" y="43" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">ETH / USDC Pool</text>

      {/* ETH reserve column (x) — small reserve, short bar */}
      {/* Container outline */}
      <rect x="95" y="60" width="60" height="110" rx="4" fill="#1e3a5f" stroke="#60a5fa" strokeWidth="1"/>
      <text x="125" y="75" textAnchor="middle" fill="#60a5fa" fontSize="8" fontFamily="monospace">ETH (x)</text>
      {/* ETH fill — starts short (small reserve), grows when ETH is swapped IN */}
      <rect x="97" y="140" width="56" height="28" rx="2" fill="#3b82f6" opacity="0.8">
        <animate attributeName="height" values="28;55;28" dur="5s" repeatCount="indefinite"/>
        <animate attributeName="y" values="140;113;140" dur="5s" repeatCount="indefinite"/>
      </rect>
      <text x="125" y="162" textAnchor="middle" fill="#93c5fd" fontSize="8" fontFamily="monospace">
        1,000
      </text>
      <text x="125" y="172" textAnchor="middle" fill="#60a5fa" fontSize="6.5" fontFamily="monospace">
        <animate attributeName="opacity" values="1;0.4;1" dur="5s" repeatCount="indefinite"/>
        ETH
      </text>

      {/* USDC reserve column (y) — large reserve, tall bar */}
      <rect x="225" y="60" width="60" height="110" rx="4" fill="#1c3a2e" stroke="#4ade80" strokeWidth="1"/>
      <text x="255" y="75" textAnchor="middle" fill="#4ade80" fontSize="8" fontFamily="monospace">USDC (y)</text>
      {/* USDC fill — starts tall (large reserve), shrinks when USDC is swapped OUT */}
      <rect x="227" y="70" width="56" height="98" rx="2" fill="#16a34a" opacity="0.75">
        <animate attributeName="height" values="98;70;98" dur="5s" repeatCount="indefinite"/>
        <animate attributeName="y" values="70;98;70" dur="5s" repeatCount="indefinite"/>
      </rect>
      <text x="255" y="162" textAnchor="middle" fill="#86efac" fontSize="7.5" fontFamily="monospace">
        2,000,000
      </text>
      <text x="255" y="172" textAnchor="middle" fill="#4ade80" fontSize="6.5" fontFamily="monospace">
        <animate attributeName="opacity" values="1;0.4;1" dur="5s" repeatCount="indefinite"/>
        USDC
      </text>

      {/* Swap arrow (ETH into pool) */}
      <line x1="50" y1="100" x2="88" y2="100" stroke="#facc15" strokeWidth="2" className="swap-arr"/>
      <polygon points="88,95 96,100 88,105" fill="#facc15"/>
      <text x="55" y="93" fill="#facc15" fontSize="8" fontFamily="monospace">+100 ETH</text>

      {/* Output arrow (USDC out of pool) */}
      <line x1="292" y1="100" x2="328" y2="100" stroke="#facc15" strokeWidth="2" className="swap-arr"/>
      <polygon points="328,95 336,100 328,105" fill="#facc15"/>
      <text x="330" y="93" fill="#facc15" fontSize="7.5" fontFamily="monospace">~181,819</text>
      <text x="330" y="105" fill="#facc15" fontSize="7.5" fontFamily="monospace">USDC out</text>

      {/* k constant label */}
      <g className="k-label">
        <rect x="155" y="103" width="70" height="18" rx="4" fill="#1e293b" stroke="#f59e0b" strokeWidth="1"/>
        <text x="190" y="115" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="bold" fontFamily="monospace">x · y = k</text>
      </g>

      {/* Formula */}
      <text x="190" y="195" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">k = 2,000,000,000 (constant)</text>

      {/* Title */}
      <text x="190" y="15" textAnchor="middle" fill="#facc15" fontSize="12" fontWeight="bold" fontFamily="sans-serif">AMM Constant Product</text>
      <text x="190" y="210" textAnchor="middle" fill="#64748b" fontSize="8.5" fontFamily="sans-serif">x increases → y decreases to keep k constant</text>
    </svg>
  );
}
