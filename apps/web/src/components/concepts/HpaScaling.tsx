export default function HpaScaling() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="HPA Scaling diagram">
      <style>{`
        @keyframes needleSpin {
          0%, 20%  { transform: rotate(-60deg); }
          60%, 80% { transform: rotate(35deg); }
          100%     { transform: rotate(-60deg); }
        }
        @keyframes pod2SlideIn {
          0%, 50%  { opacity: 0; transform: translateX(30px); }
          70%, 100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes pod3SlideIn {
          0%, 60%  { opacity: 0; transform: translateX(30px); }
          80%, 100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes thresholdPulse {
          0%, 100% { stroke-opacity: 0.6; }
          50%      { stroke-opacity: 1; }
        }
        .needle    { animation: needleSpin 5s ease-in-out infinite; transform-origin: 190px 85px; }
        .pod2-anim { animation: pod2SlideIn 5s ease-in-out infinite; transform-origin: 0 0; }
        .pod3-anim { animation: pod3SlideIn 5s ease-in-out infinite; transform-origin: 0 0; }
        .threshold { animation: thresholdPulse 2s ease-in-out infinite; }
      `}</style>

      {/* Gauge background arc */}
      <path d="M 130 85 A 60 60 0 0 1 250 85" fill="none" stroke="#1e293b" strokeWidth="14"/>
      <path d="M 130 85 A 60 60 0 0 1 250 85" fill="none" stroke="#334155" strokeWidth="12"/>
      {/* Colored segments */}
      <path d="M 130 85 A 60 60 0 0 1 160 40" fill="none" stroke="#4ade80" strokeWidth="12" strokeLinecap="round"/>
      <path d="M 160 40 A 60 60 0 0 1 220 40" fill="none" stroke="#fbbf24" strokeWidth="12" strokeLinecap="round"/>
      <path d="M 220 40 A 60 60 0 0 1 250 85" fill="none" stroke="#ef4444" strokeWidth="12" strokeLinecap="round"/>

      {/* Needle */}
      <g className="needle">
        <line x1="190" y1="85" x2="190" y2="38" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="190" cy="85" r="5" fill="#e2e8f0"/>
      </g>

      {/* Gauge labels */}
      <text x="124" y="102" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="monospace">0%</text>
      <text x="190" y="30"  textAnchor="middle" fill="#fbbf24" fontSize="9" fontFamily="monospace">50%</text>
      <text x="256" y="102" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="monospace">100%</text>

      {/* HPA info box */}
      <rect x="120" y="100" width="140" height="42" rx="6" fill="#1e293b" stroke="#326CE5" strokeWidth="1.5"/>
      <text x="190" y="116" textAnchor="middle" fill="#60a5fa" fontSize="9" fontWeight="bold" fontFamily="monospace">HPA</text>
      <text x="190" y="128" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontFamily="monospace">min:1 / max:5 / target:50%</text>
      <text x="190" y="138" textAnchor="middle" fill="#64748b" fontSize="7.5" fontFamily="monospace">scaleTargetRef: worker</text>

      {/* Threshold line */}
      <line x1="60" y1="163" x2="320" y2="163" stroke="#fbbf24" strokeWidth="1" strokeDasharray="6,4" className="threshold"/>
      <text x="325" y="167" fill="#fbbf24" fontSize="8" fontFamily="monospace">50%</text>

      {/* Pod 1 - always visible */}
      <rect x="60" y="170" width="55" height="38" rx="7" fill="#1e293b" stroke="#326CE5" strokeWidth="1.5"/>
      <circle cx="87" cy="184" r="7" fill="#326CE5"/>
      <text x="87" y="188" textAnchor="middle" fill="white" fontSize="8">⬡</text>
      <text x="87" y="202" textAnchor="middle" fill="#4ade80" fontSize="7" fontFamily="monospace">pod-1</text>

      {/* Pod 2 - slides in */}
      <g className="pod2-anim">
        <rect x="128" y="170" width="55" height="38" rx="7" fill="#1e293b" stroke="#326CE5" strokeWidth="1.5"/>
        <circle cx="155" cy="184" r="7" fill="#326CE5"/>
        <text x="155" y="188" textAnchor="middle" fill="white" fontSize="8">⬡</text>
        <text x="155" y="202" textAnchor="middle" fill="#4ade80" fontSize="7" fontFamily="monospace">pod-2</text>
      </g>

      {/* Pod 3 - slides in */}
      <g className="pod3-anim">
        <rect x="196" y="170" width="55" height="38" rx="7" fill="#1e293b" stroke="#326CE5" strokeWidth="1.5"/>
        <circle cx="223" cy="184" r="7" fill="#326CE5"/>
        <text x="223" y="188" textAnchor="middle" fill="white" fontSize="8">⬡</text>
        <text x="223" y="202" textAnchor="middle" fill="#4ade80" fontSize="7" fontFamily="monospace">pod-3</text>
      </g>

      {/* Title */}
      <text x="190" y="15" textAnchor="middle" fill="#60a5fa" fontSize="12" fontWeight="bold" fontFamily="sans-serif">HPA Autoscaling</text>
    </svg>
  );
}
