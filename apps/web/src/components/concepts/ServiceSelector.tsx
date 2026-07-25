export default function ServiceSelector() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Service Selector diagram">
      <style>{`
        @keyframes dashPulse {
          0%, 40%  { opacity: 1; stroke-dashoffset: 0; }
          55%, 60% { opacity: 0; }
          100%     { opacity: 0; }
        }
        @keyframes solidDraw {
          0%, 54%  { stroke-dashoffset: 120; opacity: 0; }
          80%, 100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes counterUp {
          0%, 70%  { opacity: 0; }
          85%, 100% { opacity: 1; }
        }
        .bad-line  { stroke-dasharray: 8,5; animation: dashPulse 5s ease-in-out infinite; }
        .good-line { stroke-dasharray: 120; animation: solidDraw 5s ease-in-out infinite; }
        .counter   { animation: counterUp 5s ease-in-out infinite; }
      `}</style>

      {/* Service box */}
      <rect x="20" y="70" width="110" height="80" rx="8" fill="#1e293b" stroke="#326CE5" strokeWidth="2"/>
      <text x="75" y="90" textAnchor="middle" fill="#60a5fa" fontSize="11" fontWeight="bold" fontFamily="monospace">Service</text>
      <text x="75" y="108" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontFamily="monospace">selector:</text>
      <text x="75" y="122" textAnchor="middle" fill="#fbbf24" fontSize="9" fontFamily="monospace">app=backend</text>
      <text x="75" y="140" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace">port: 80</text>

      {/* Mismatched pod */}
      <rect x="220" y="50" width="120" height="50" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
      <circle cx="245" cy="76" r="8" fill="#334155"/>
      <text x="245" y="80" textAnchor="middle" fill="#e2e8f0" fontSize="10">⬡</text>
      <text x="303" y="70" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="monospace">app=frontend</text>
      <text x="303" y="84" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="monospace">✗ mismatch</text>

      {/* Matched pod */}
      <rect x="220" y="130" width="120" height="50" rx="8" fill="#1e293b" stroke="#4ade80" strokeWidth="1.5"/>
      <circle cx="245" cy="156" r="8" fill="#326CE5"/>
      <text x="245" y="160" textAnchor="middle" fill="white" fontSize="10">⬡</text>
      <text x="303" y="150" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="monospace">app=backend</text>
      <text x="303" y="164" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="monospace">✓ matched</text>

      {/* Bad dashed line */}
      <line x1="132" y1="95" x2="218" y2="75" stroke="#ef4444" strokeWidth="1.5" className="bad-line"/>

      {/* Good solid line */}
      <line x1="132" y1="115" x2="218" y2="155" stroke="#4ade80" strokeWidth="2" className="good-line"/>
      <polygon points="218,150 226,155 218,160" fill="#4ade80"/>

      {/* Endpoints counter */}
      <g className="counter">
        <rect x="130" y="155" width="78" height="18" rx="4" fill="#14532d" stroke="#4ade80" strokeWidth="1"/>
        <text x="169" y="168" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="monospace">Endpoints: 1</text>
      </g>

      {/* Title */}
      <text x="190" y="20" textAnchor="middle" fill="#60a5fa" fontSize="13" fontWeight="bold" fontFamily="sans-serif">Service Selector</text>
      <text x="190" y="35" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="sans-serif">label mismatch → no endpoints</text>
    </svg>
  );
}
