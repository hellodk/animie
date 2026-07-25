export default function SecretInjection() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Secret Injection diagram">
      <style>{`
        @keyframes vaultGlow {
          0%, 100% { filter: drop-shadow(0 0 2px #fbbf24); stroke: #fbbf24; }
          50%      { filter: drop-shadow(0 0 8px #fbbf24); stroke: #fbbf24; }
        }
        @keyframes arrow1Draw {
          0%, 25%  { stroke-dashoffset: 60; opacity: 0; }
          50%, 100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes arrow2Draw {
          0%, 50%  { stroke-dashoffset: 60; opacity: 0; }
          75%, 100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes envBefore {
          0%, 74%  { opacity: 1; }
          75%, 100% { opacity: 0; }
        }
        @keyframes envAfter {
          0%, 74%  { opacity: 0; }
          75%, 100% { opacity: 1; }
        }
        .vault      { animation: vaultGlow 2s ease-in-out infinite; }
        .arr1       { stroke-dasharray: 60; animation: arrow1Draw 5s ease-in-out infinite; }
        .arr2       { stroke-dasharray: 60; animation: arrow2Draw 5s ease-in-out infinite; }
        .env-before { animation: envBefore 5s ease-in-out infinite; }
        .env-after  { animation: envAfter 5s ease-in-out infinite; }
      `}</style>

      {/* Secret vault */}
      <rect x="15" y="75" width="75" height="70" rx="8" fill="#1e293b" stroke="#fbbf24" strokeWidth="2" className="vault"/>
      <text x="52" y="105" textAnchor="middle" fill="#fbbf24" fontSize="20">🔒</text>
      <text x="52" y="123" textAnchor="middle" fill="#fbbf24" fontSize="9" fontFamily="monospace">Secret</text>
      <text x="52" y="136" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace">db-credentials</text>

      {/* Arrow 1: Secret → envFrom */}
      <line x1="92" y1="110" x2="148" y2="110" stroke="#fbbf24" strokeWidth="2" className="arr1"/>
      <polygon points="148,105 158,110 148,115" fill="#fbbf24" opacity="0.9"/>

      {/* envFrom box */}
      <rect x="158" y="85" width="90" height="50" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
      <text x="203" y="105" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="bold" fontFamily="monospace">Pod spec</text>
      <text x="203" y="120" textAnchor="middle" fill="#60a5fa" fontSize="8" fontFamily="monospace">envFrom:</text>
      <text x="203" y="130" textAnchor="middle" fill="#60a5fa" fontSize="8" fontFamily="monospace">secretRef</text>

      {/* Arrow 2: envFrom → container */}
      <line x1="250" y1="110" x2="295" y2="110" stroke="#4ade80" strokeWidth="2" className="arr2"/>
      <polygon points="295,105 305,110 295,115" fill="#4ade80" opacity="0.9"/>

      {/* Container box */}
      <rect x="305" y="70" width="65" height="80" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
      <text x="337" y="90" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="bold" fontFamily="monospace">Container</text>
      <text x="337" y="104" textAnchor="middle" fill="#e2e8f0" fontSize="7.5" fontFamily="monospace">env:</text>

      {/* Before state */}
      <g className="env-before">
        <text x="337" y="118" textAnchor="middle" fill="#ef4444" fontSize="7" fontFamily="monospace">DB_URL=</text>
        <text x="337" y="130" textAnchor="middle" fill="#ef4444" fontSize="7" fontFamily="monospace">undefined</text>
      </g>

      {/* After state */}
      <g className="env-after">
        <text x="337" y="116" textAnchor="middle" fill="#4ade80" fontSize="6.5" fontFamily="monospace">DB_URL=</text>
        <text x="337" y="127" textAnchor="middle" fill="#4ade80" fontSize="6.5" fontFamily="monospace">postgres</text>
        <text x="337" y="138" textAnchor="middle" fill="#4ade80" fontSize="6.5" fontFamily="monospace">://... ✓</text>
      </g>

      {/* Title */}
      <text x="190" y="20" textAnchor="middle" fill="#60a5fa" fontSize="13" fontWeight="bold" fontFamily="sans-serif">Secret Injection</text>
      <text x="190" y="35" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="sans-serif">Secret → envFrom → container env</text>

      {/* Step labels */}
      <text x="52"  y="160" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="sans-serif">1. Secret</text>
      <text x="203" y="148" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="sans-serif">2. Pod spec</text>
      <text x="337" y="160" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="sans-serif">3. Injected</text>
    </svg>
  );
}
