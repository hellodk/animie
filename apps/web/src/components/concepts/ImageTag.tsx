export default function ImageTag() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Image Tag diagram">
      <style>{`
        @keyframes wrongFlash {
          0%, 30%  { opacity: 1; stroke: #ef4444; }
          50%, 60% { opacity: 0; }
          100%     { opacity: 0; }
        }
        @keyframes correctGlow {
          0%, 59% { opacity: 0; }
          75%, 90% { opacity: 1; filter: drop-shadow(0 0 4px #4ade80); }
          100%     { opacity: 1; }
        }
        @keyframes arrowDraw {
          0%, 74%  { stroke-dashoffset: 80; opacity: 0; }
          90%, 100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes registryPulse {
          0%, 100% { stroke: #326CE5; }
          50%      { stroke: #60a5fa; filter: drop-shadow(0 0 6px #326CE5); }
        }
        .wrong-row { animation: wrongFlash 5s ease-in-out infinite; }
        .correct-row { animation: correctGlow 5s ease-in-out infinite; }
        .final-arrow { stroke-dasharray: 80; animation: arrowDraw 5s ease-in-out infinite; }
        .registry { animation: registryPulse 2s ease-in-out infinite; }
      `}</style>

      {/* Registry icon */}
      <rect x="20" y="75" width="80" height="70" rx="8" fill="#1e293b" stroke="#326CE5" strokeWidth="2" className="registry"/>
      <text x="60" y="105" textAnchor="middle" fill="#60a5fa" fontSize="18">⬛</text>
      <text x="60" y="125" textAnchor="middle" fill="#60a5fa" fontSize="10" fontFamily="monospace">Registry</text>

      {/* Wrong row */}
      <g className="wrong-row">
        <rect x="120" y="80" width="130" height="28" rx="5" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5"/>
        <text x="185" y="99" textAnchor="middle" fill="#ef4444" fontSize="10" fontFamily="monospace">myapp:latest ✗</text>
      </g>

      {/* Correct row */}
      <g className="correct-row">
        <rect x="120" y="115" width="130" height="28" rx="5" fill="#14532d" stroke="#4ade80" strokeWidth="1.5"/>
        <text x="185" y="134" textAnchor="middle" fill="#4ade80" fontSize="10" fontFamily="monospace">myapp:v1.2.3 ✓</text>
      </g>

      {/* Arrow to pod */}
      <line x1="252" y1="129" x2="295" y2="129" stroke="#4ade80" strokeWidth="2" className="final-arrow"/>
      <polygon points="295,124 305,129 295,134" fill="#4ade80" opacity="0.9"/>

      {/* Pod box */}
      <rect x="305" y="105" width="60" height="50" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
      <circle cx="335" cy="123" r="9" fill="#326CE5"/>
      <text x="335" y="127" textAnchor="middle" fill="white" fontSize="10">⬡</text>
      <text x="335" y="147" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontFamily="monospace">Pod</text>

      {/* Labels */}
      <text x="185" y="68" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="sans-serif">Wrong tag → broken</text>
      <text x="185" y="160" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="sans-serif">Correct pinned tag → stable</text>

      {/* Title */}
      <text x="190" y="20" textAnchor="middle" fill="#60a5fa" fontSize="13" fontWeight="bold" fontFamily="sans-serif">Image Tag</text>
      <text x="190" y="35" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="sans-serif">:latest → :v1.2.3 (pinned)</text>
    </svg>
  );
}
