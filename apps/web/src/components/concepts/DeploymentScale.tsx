export default function DeploymentScale() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Deployment Scale diagram">
      <style>{`
        @keyframes fadeInRight {
          0%, 40%  { opacity: 0; transform: translateX(20px); }
          65%, 100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes drawLine {
          0%, 40%  { stroke-dashoffset: 60; opacity: 0; }
          65%, 100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes labelFlip {
          0%, 39%  { opacity: 1; }
          40%, 64% { opacity: 0; }
          65%, 100% { opacity: 0; }
        }
        @keyframes labelFlip2 {
          0%, 39%  { opacity: 0; }
          40%, 100% { opacity: 1; }
        }
        .pod2 { animation: fadeInRight 4s ease-in-out infinite; transform-origin: 0 0; }
        .pod3 { animation: fadeInRight 4s ease-in-out 0.3s infinite; transform-origin: 0 0; }
        .line2 { stroke-dasharray: 60; animation: drawLine 4s ease-in-out infinite; }
        .line3 { stroke-dasharray: 60; animation: drawLine 4s ease-in-out 0.3s infinite; }
        .lbl1  { animation: labelFlip 4s ease-in-out infinite; }
        .lbl3  { animation: labelFlip2 4s ease-in-out infinite; }
      `}</style>

      {/* Deployment box */}
      <rect x="130" y="20" width="120" height="40" rx="8" fill="#1e293b" stroke="#326CE5" strokeWidth="2"/>
      <text x="190" y="37" textAnchor="middle" fill="#60a5fa" fontSize="11" fontWeight="bold" fontFamily="monospace">Deployment</text>
      <text x="190" y="52" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">frontend</text>

      {/* Replica label */}
      <g className="lbl1">
        <rect x="152" y="60" width="76" height="16" rx="3" fill="#1e3a5f"/>
        <text x="190" y="72" textAnchor="middle" fill="#60a5fa" fontSize="9" fontFamily="monospace">replicas: 1</text>
      </g>
      <g className="lbl3">
        <rect x="152" y="60" width="76" height="16" rx="3" fill="#14532d"/>
        <text x="190" y="72" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="monospace">replicas: 3</text>
      </g>

      {/* Line to pod 1 */}
      <line x1="190" y1="60" x2="80" y2="130" stroke="#334155" strokeWidth="1.5"/>
      {/* Line to pod 2 */}
      <line x1="190" y1="60" x2="190" y2="130" stroke="#334155" strokeWidth="1.5" className="line2"/>
      {/* Line to pod 3 */}
      <line x1="190" y1="60" x2="300" y2="130" stroke="#334155" strokeWidth="1.5" className="line3"/>

      {/* Pod 1 — always visible */}
      <rect x="40" y="130" width="80" height="45" rx="8" fill="#1e293b" stroke="#326CE5" strokeWidth="1.5"/>
      <circle cx="80" cy="148" r="8" fill="#326CE5"/>
      <text x="80" y="152" textAnchor="middle" fill="white" fontSize="10">⬡</text>
      <text x="80" y="168" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="monospace">Running</text>

      {/* Pod 2 — fades in */}
      <g className="pod2">
        <rect x="150" y="130" width="80" height="45" rx="8" fill="#1e293b" stroke="#326CE5" strokeWidth="1.5"/>
        <circle cx="190" cy="148" r="8" fill="#326CE5"/>
        <text x="190" y="152" textAnchor="middle" fill="white" fontSize="10">⬡</text>
        <text x="190" y="168" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="monospace">Running</text>
      </g>

      {/* Pod 3 — fades in */}
      <g className="pod3">
        <rect x="260" y="130" width="80" height="45" rx="8" fill="#1e293b" stroke="#326CE5" strokeWidth="1.5"/>
        <circle cx="300" cy="148" r="8" fill="#326CE5"/>
        <text x="300" y="152" textAnchor="middle" fill="white" fontSize="10">⬡</text>
        <text x="300" y="168" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="monospace">Running</text>
      </g>

      {/* Title */}
      <text x="190" y="205" textAnchor="middle" fill="#60a5fa" fontSize="11" fontFamily="sans-serif">Scale: 1 replica → 3 replicas</text>
    </svg>
  );
}
