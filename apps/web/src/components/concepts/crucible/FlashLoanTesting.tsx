export default function FlashLoanTesting() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Flash Loan Testing diagram">
      <style>{`
        @keyframes lend {
          0%,5%   { stroke-dashoffset: 100; opacity: 0; }
          18%,35% { stroke-dashoffset: 0;   opacity: 1; }
          45%,100%{ stroke-dashoffset: 0;   opacity: 0.2; }
        }
        @keyframes repay {
          0%,50%  { stroke-dashoffset: 100; opacity: 0; }
          65%,80% { stroke-dashoffset: 0;   opacity: 1; }
          90%,100%{ stroke-dashoffset: 0;   opacity: 0.2; }
        }
        @keyframes priceDistort {
          0%,20%  { d: path("M 155 160 Q 185 140 215 160 Q 245 180 275 160"); }
          40%,60% { d: path("M 155 160 Q 185 110 215 140 Q 245 170 275 160"); }
          80%,100%{ d: path("M 155 160 Q 185 140 215 160 Q 245 180 275 160"); }
        }
        @keyframes invariantCheck {
          0%,70%  { opacity: 0; }
          80%,90% { opacity: 1; fill: #4ade80; }
          92%,100%{ opacity: 1; fill: #ef4444; }
        }
        @keyframes amountPulse {
          0%,15%  { opacity: 0; }
          25%,50% { opacity: 1; }
          60%,100%{ opacity: 0.3; }
        }
        .lend-arr    { stroke-dasharray: 100; animation: lend 4.5s ease-in-out infinite; }
        .repay-arr   { stroke-dasharray: 100; animation: repay 4.5s ease-in-out infinite; }
        .price-curve { animation: priceDistort 4.5s ease-in-out infinite; }
        .inv-check   { animation: invariantCheck 4.5s ease-in-out infinite; }
        .amount      { animation: amountPulse 4.5s ease-in-out infinite; }
      `}</style>

      <rect width="380" height="220" fill="#0f172a" rx="10"/>

      {/* Lender box */}
      <rect x="15" y="65" width="85" height="45" rx="7" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.5"/>
      <text x="57" y="85" textAnchor="middle" fill="#93c5fd" fontSize="9" fontFamily="monospace">vm.deal()</text>
      <text x="57" y="98" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="monospace">flash capital</text>

      {/* Borrower box */}
      <rect x="148" y="65" width="85" height="45" rx="7" fill="#1e293b" stroke="#8b5cf6" strokeWidth="1.5"/>
      <text x="190" y="85" textAnchor="middle" fill="#c4b5fd" fontSize="9" fontFamily="monospace">Attacker</text>
      <text x="190" y="98" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="monospace">swapAforB()</text>

      {/* Lend arrow */}
      <line x1="100" y1="80" x2="146" y2="80" stroke="#60a5fa" strokeWidth="2" className="lend-arr"/>
      <polygon points="146,75 154,80 146,85" fill="#60a5fa"/>

      {/* Amount label */}
      <text x="123" y="73" textAnchor="middle" fill="#60a5fa" fontSize="7" fontFamily="monospace" className="amount">1000 ETH →</text>

      {/* Repay arrow */}
      <line x1="146" y1="96" x2="100" y2="96" stroke="#4ade80" strokeWidth="2" className="repay-arr"/>
      <polygon points="100,91 92,96 100,101" fill="#4ade80"/>
      <text x="123" y="112" textAnchor="middle" fill="#4ade80" fontSize="7" fontFamily="monospace">← repay + fee</text>

      {/* Price chart */}
      <rect x="148" y="125" width="200" height="65" rx="6" fill="#0d1117" stroke="#21262d" strokeWidth="1"/>
      <text x="248" y="140" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace">AMM spot price</text>
      <path d="M 155 160 Q 185 140 215 160 Q 245 180 275 160" fill="none" stroke="#60a5fa" strokeWidth="1.5" className="price-curve"/>
      <text x="248" y="182" textAnchor="middle" fill="#fbbf24" fontSize="7" fontFamily="monospace">k=x*y manipulated mid-tx</text>

      {/* Invariant check */}
      <rect x="15" y="125" width="120" height="40" rx="6" fill="#0d1117" stroke="#21262d" strokeWidth="1"/>
      <text x="75" y="142" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace">invariant check:</text>
      <text x="75" y="157" textAnchor="middle" fontSize="8" fontFamily="monospace" className="inv-check">k == x*y ?</text>

      <text x="190" y="25" textAnchor="middle" fill="#f97316" fontSize="13" fontWeight="bold" fontFamily="sans-serif">Flash Loan Testing</text>
      <text x="190" y="40" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="sans-serif">borrow → manipulate → repay → invariant fails</text>
    </svg>
  );
}
