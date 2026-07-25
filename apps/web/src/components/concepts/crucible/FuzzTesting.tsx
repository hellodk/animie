export default function FuzzTesting() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Fuzz Testing diagram">
      <style>{`
        @keyframes dotAppear {
          0%,5%   { opacity: 0; r: 0; }
          15%,80% { opacity: 0.7; r: 3; }
          90%,100%{ opacity: 0; r: 3; }
        }
        @keyframes redDot {
          0%,55%  { opacity: 0; r: 0; }
          65%,80% { opacity: 1; r: 5; }
          85%,88% { opacity: 1; r: 8; }
          92%,100%{ opacity: 1; r: 5; }
        }
        @keyframes counterBox {
          0%,60%  { opacity: 0; transform: translateY(6px); }
          75%,100%{ opacity: 1; transform: translateY(0); }
        }
        @keyframes scanLine {
          0%    { transform: translateX(-120px); opacity: 0.3; }
          100%  { transform: translateX(120px); opacity: 0; }
        }
        .dot1 { animation: dotAppear 4s 0.1s ease-in-out infinite; }
        .dot2 { animation: dotAppear 4s 0.3s ease-in-out infinite; }
        .dot3 { animation: dotAppear 4s 0.6s ease-in-out infinite; }
        .dot4 { animation: dotAppear 4s 0.9s ease-in-out infinite; }
        .dot5 { animation: dotAppear 4s 1.2s ease-in-out infinite; }
        .dot6 { animation: dotAppear 4s 1.5s ease-in-out infinite; }
        .dot7 { animation: dotAppear 4s 1.8s ease-in-out infinite; }
        .dot8 { animation: dotAppear 4s 2.1s ease-in-out infinite; }
        .dot9 { animation: dotAppear 4s 2.4s ease-in-out infinite; }
        .dot-red { animation: redDot 4s ease-in-out infinite; }
        .counter { animation: counterBox 4s ease-in-out infinite; transform-origin: 285px 155px; }
        .scan    { animation: scanLine 2s linear infinite; }
      `}</style>

      <rect width="380" height="220" fill="#0f172a" rx="10"/>

      {/* Input space box */}
      <rect x="30" y="45" width="200" height="145" rx="8" fill="#0d1117" stroke="#334155" strokeWidth="1.5"/>
      <text x="130" y="62" textAnchor="middle" fill="#475569" fontSize="9" fontFamily="monospace">input space (uint256 × uint256)</text>

      {/* Axis labels */}
      <text x="33" y="182" fill="#334155" fontSize="8" fontFamily="monospace">0</text>
      <text x="220" y="182" fill="#334155" fontSize="8" fontFamily="monospace">MAX</text>
      <text x="33" y="68" fill="#334155" fontSize="8" fontFamily="monospace">MAX</text>

      {/* Random blue dots — spread across mid-range of input space */}
      <circle cx="68"  cy="140" r="3" fill="#60a5fa" className="dot1"/>
      <circle cx="110" cy="95"  r="3" fill="#60a5fa" className="dot2"/>
      <circle cx="155" cy="130" r="3" fill="#60a5fa" className="dot3"/>
      <circle cx="85"  cy="108" r="3" fill="#60a5fa" className="dot4"/>
      <circle cx="145" cy="75"  r="3" fill="#60a5fa" className="dot5"/>
      <circle cx="100" cy="160" r="3" fill="#60a5fa" className="dot6"/>
      <circle cx="72"  cy="72"  r="3" fill="#60a5fa" className="dot7"/>
      <circle cx="130" cy="148" r="3" fill="#60a5fa" className="dot8"/>
      <circle cx="120" cy="82"  r="3" fill="#60a5fa" className="dot9"/>

      {/* Boundary line — overflow zone near MAX-a axis */}
      <line x1="205" y1="48" x2="205" y2="187" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4,3" opacity="0.4"/>
      <text x="207" y="58" fill="#fbbf24" fontSize="7" fontFamily="monospace">overflow boundary</text>

      {/* Red counterexample dot — near top-right (max a, small b) */}
      <circle cx="218" cy="55" r="5" fill="#ef4444" className="dot-red"/>

      {/* Counterexample box */}
      <g className="counter">
        <rect x="235" y="90" width="135" height="65" rx="6" fill="#1c0a0a" stroke="#ef4444" strokeWidth="1.5"/>
        <text x="302" y="108" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="bold" fontFamily="monospace">Counterexample!</text>
        <text x="302" y="123" textAnchor="middle" fill="#fca5a5" fontSize="7.5" fontFamily="monospace">a = type(uint256).max</text>
        <text x="302" y="136" textAnchor="middle" fill="#fca5a5" fontSize="7.5" fontFamily="monospace">b = 1</text>
        <text x="302" y="149" textAnchor="middle" fill="#fb923c" fontSize="7" fontFamily="monospace">→ overflow!</text>
      </g>

      {/* Scan animation */}
      <rect x="30" y="45" width="4" height="145" fill="#3b82f6" opacity="0.15" className="scan"/>

      <text x="190" y="25" textAnchor="middle" fill="#f97316" fontSize="13" fontWeight="bold" fontFamily="sans-serif">Fuzz Testing</text>
      <text x="190" y="40" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="sans-serif">random inputs → find the boundary bug</text>
    </svg>
  );
}
