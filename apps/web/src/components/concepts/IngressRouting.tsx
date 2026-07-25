export default function IngressRouting() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" role="img" aria-label="Ingress Routing diagram">
      <style>{`
        @keyframes ghostRule {
          0%, 15%  { opacity: 1; }
          45%, 100% { opacity: 0; }
        }
        @keyframes ruleAppear {
          0%, 44%  { opacity: 0; }
          60%, 100% { opacity: 1; }
        }
        @keyframes ghostFade {
          0%   { opacity: 1; }
          30%  { opacity: 1; }
          40%  { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes correctFade {
          0%   { opacity: 0; }
          55%  { opacity: 0; }
          65%  { opacity: 1; }
          92%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes bounceFade {
          0%   { opacity: 0; }
          25%  { opacity: 1; }
          38%  { opacity: 1; }
          48%  { opacity: 0; }
          100% { opacity: 0; }
        }
        .ghost-rule { animation: ghostRule 7s ease-in-out infinite; }
        .real-rule  { animation: ruleAppear 7s ease-in-out infinite; }
        .ghost-packet { animation: ghostFade 7s ease-in-out infinite; }
        .correct-packet { animation: correctFade 7s ease-in-out infinite; }
        .bounce     { animation: bounceFade 7s ease-in-out infinite; }
      `}</style>

      {/* Route path definitions */}
      <defs>
        <path id="ghostPath" d="M52,100 L173,100 L128,100 L52,100"/>
        <path id="correctPath" d="M52,100 L173,100 L308,66"/>
      </defs>

      {/* Internet cloud */}
      <ellipse cx="52" cy="100" rx="38" ry="25" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
      <text x="52" y="97" textAnchor="middle" fill="#60a5fa" fontSize="14">☁</text>
      <text x="52" y="112" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontFamily="monospace">Internet</text>

      {/* Arrow cloud → ingress */}
      <line x1="91" y1="100" x2="126" y2="100" stroke="#334155" strokeWidth="1.5"/>
      <polygon points="126,95 128,100 126,105" fill="#334155"/>

      {/* Ingress box */}
      <rect x="128" y="70" width="90" height="60" rx="8" fill="#1e293b" stroke="#326CE5" strokeWidth="2"/>
      <text x="173" y="91" textAnchor="middle" fill="#60a5fa" fontSize="10" fontWeight="bold" fontFamily="monospace">Ingress</text>

      {/* Ghost rule (no route) */}
      <g className="ghost-rule">
        <text x="173" y="106" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace">no rules</text>
        <text x="173" y="119" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace">404 ✗</text>
      </g>

      {/* Real rules */}
      <g className="real-rule">
        <text x="173" y="104" textAnchor="middle" fill="#4ade80" fontSize="7.5" fontFamily="monospace">/api→svc-a</text>
        <text x="173" y="116" textAnchor="middle" fill="#4ade80" fontSize="7.5" fontFamily="monospace">/web→svc-b</text>
        <text x="173" y="124" textAnchor="middle" fill="#4ade80" fontSize="7" fontFamily="monospace">✓ routed</text>
      </g>

      {/* Bounce-back arrow */}
      <g className="bounce">
        <line x1="128" y1="100" x2="95" y2="100" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,3"/>
        <polygon points="95,95 85,100 95,105" fill="#ef4444"/>
        <text x="108" y="88" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace">no route!</text>
      </g>

      {/* Arrow ingress → service-a */}
      <line x1="220" y1="88" x2="255" y2="65" stroke="#334155" strokeWidth="1.5"/>
      <polygon points="252,61 263,63 258,72" fill="#334155"/>

      {/* Arrow ingress → service-b */}
      <line x1="220" y1="112" x2="255" y2="135" stroke="#334155" strokeWidth="1.5"/>
      <polygon points="252,138 263,137 258,128" fill="#334155"/>

      {/* service-a */}
      <rect x="263" y="50" width="90" height="32" rx="7" fill="#1e293b" stroke="#326CE5" strokeWidth="1.5"/>
      <text x="308" y="64" textAnchor="middle" fill="#60a5fa" fontSize="9" fontWeight="bold" fontFamily="monospace">service-a</text>
      <text x="308" y="76" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace">/api</text>

      {/* service-b */}
      <rect x="263" y="120" width="90" height="32" rx="7" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
      <text x="308" y="134" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="bold" fontFamily="monospace">service-b</text>
      <text x="308" y="146" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace">/web</text>

      {/* Ghost packet — red, follows ghostPath (bounces back) */}
      <circle r="5" fill="#ef4444" className="ghost-packet">
        <animateMotion dur="7s" repeatCount="indefinite" calcMode="linear"
          keyTimes="0;0.2;0.3;0.42;1"
          keyPoints="0;0.5;0.5;1;1">
          <mpath xlinkHref="#ghostPath"/>
        </animateMotion>
      </circle>

      {/* Correct packet — green, follows correctPath to service-a */}
      <circle r="5" fill="#4ade80" className="correct-packet">
        <animateMotion dur="7s" repeatCount="indefinite" calcMode="linear"
          keyTimes="0;0.55;0.65;0.92;1"
          keyPoints="0;0;0;1;1">
          <mpath xlinkHref="#correctPath"/>
        </animateMotion>
      </circle>

      {/* Title */}
      <text x="190" y="18" textAnchor="middle" fill="#60a5fa" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Ingress Routing</text>
      <text x="190" y="32" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="sans-serif">ghost route → 404; rule added → routed ✓</text>
    </svg>
  );
}
