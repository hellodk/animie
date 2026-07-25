export default function RollbackHistory() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Rollback History diagram">
      <style>{`
        @keyframes arrowSlideUp {
          0%, 30%  { transform: translateY(0); }
          60%, 100% { transform: translateY(-60px); }
        }
        @keyframes imageChange {
          0%, 49%  { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes imageNew {
          0%, 49%  { opacity: 0; }
          50%, 100% { opacity: 1; }
        }
        @keyframes currentBadge {
          0%, 59%  { opacity: 0; }
          70%, 100% { opacity: 1; }
        }
        .arrow-anim  { animation: arrowSlideUp 5s ease-in-out infinite; transform-origin: 0 0; }
        .image-old   { animation: imageChange 5s ease-in-out infinite; }
        .image-new   { animation: imageNew 5s ease-in-out infinite; }
        .curr-badge  { animation: currentBadge 5s ease-in-out infinite; }
      `}</style>

      {/* Timeline axis */}
      <line x1="60" y1="50" x2="60" y2="185" stroke="#334155" strokeWidth="2"/>

      {/* Revision 1 */}
      <circle cx="60" cy="65" r="8" fill="#14532d" stroke="#4ade80" strokeWidth="2"/>
      <text x="60" y="69" textAnchor="middle" fill="#4ade80" fontSize="9" fontWeight="bold">✓</text>
      <text x="80" y="60" fill="#e2e8f0" fontSize="10" fontFamily="monospace">Rev 1</text>
      <text x="80" y="72" fill="#64748b" fontSize="8" fontFamily="monospace">v1 (stable)</text>

      {/* Revision 2 */}
      <circle cx="60" cy="125" r="8" fill="#14532d" stroke="#4ade80" strokeWidth="2"/>
      <text x="60" y="129" textAnchor="middle" fill="#4ade80" fontSize="9" fontWeight="bold">✓</text>
      <text x="80" y="120" fill="#e2e8f0" fontSize="10" fontFamily="monospace">Rev 2</text>
      <text x="80" y="132" fill="#4ade80" fontSize="8" fontFamily="monospace">v2 (stable)</text>

      {/* CURRENT badge on rev 2 */}
      <g className="curr-badge">
        <rect x="118" y="114" width="44" height="14" rx="3" fill="#14532d" stroke="#4ade80" strokeWidth="1"/>
        <text x="140" y="124" textAnchor="middle" fill="#4ade80" fontSize="8" fontFamily="monospace">CURRENT</text>
      </g>

      {/* Revision 3 */}
      <circle cx="60" cy="180" r="8" fill="#7f1d1d" stroke="#ef4444" strokeWidth="2"/>
      <text x="60" y="184" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="bold">✗</text>
      <text x="80" y="175" fill="#e2e8f0" fontSize="10" fontFamily="monospace">Rev 3</text>
      <text x="80" y="187" fill="#ef4444" fontSize="8" fontFamily="monospace">v3 (CrashLoop)</text>

      {/* Current marker arrow */}
      <g className="arrow-anim">
        <polygon points="38,178 22,184 38,190" fill="#fbbf24"/>
        <line x1="38" y1="184" x2="50" y2="184" stroke="#fbbf24" strokeWidth="2"/>
        <text x="18" y="198" textAnchor="middle" fill="#fbbf24" fontSize="8" fontFamily="monospace">NOW</text>
      </g>

      {/* Deployment box */}
      <rect x="220" y="55" width="140" height="110" rx="8" fill="#1e293b" stroke="#326CE5" strokeWidth="2"/>
      <text x="290" y="75" textAnchor="middle" fill="#60a5fa" fontSize="11" fontWeight="bold" fontFamily="monospace">Deployment</text>
      <text x="290" y="90" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontFamily="monospace">checkout</text>

      {/* Image label old */}
      <g className="image-old">
        <text x="290" y="115" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="monospace">image:</text>
        <text x="290" y="130" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="monospace">v3-broken</text>
        <text x="290" y="148" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="monospace">0/4 Ready ✗</text>
      </g>

      {/* Image label new */}
      <g className="image-new">
        <text x="290" y="115" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="monospace">image:</text>
        <text x="290" y="130" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="monospace">v2</text>
        <text x="290" y="148" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="monospace">4/4 Ready ✓</text>
      </g>

      {/* undo arrow */}
      <path d="M 180 170 Q 200 150 218 120" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="5,4"/>
      <polygon points="215,118 222,111 224,122" fill="#fbbf24"/>
      <text x="185" y="162" fill="#fbbf24" fontSize="8" fontFamily="monospace">rollout undo</text>

      {/* Title */}
      <text x="190" y="20" textAnchor="middle" fill="#60a5fa" fontSize="13" fontWeight="bold" fontFamily="sans-serif">Rollback History</text>
      <text x="190" y="35" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="sans-serif">rev 3 broken → undo → rev 2 restored</text>
    </svg>
  );
}
