export default function PodLifecycle() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pod Lifecycle diagram">
      <style>{`
        @keyframes podMove {
          0%   { transform: translateX(0px); opacity: 1; }
          28%  { transform: translateX(92px); opacity: 1; }
          50%  { transform: translateX(184px); opacity: 1; }
          72%  { transform: translateX(184px); opacity: 0.2; }
          73%  { transform: translateX(0px); opacity: 0; }
          82%  { transform: translateX(0px); opacity: 1; }
          100% { transform: translateX(0px); opacity: 1; }
        }
        @keyframes arrow1 {
          0%, 18%  { stroke-dashoffset: 40; }
          32%, 100% { stroke-dashoffset: 0; }
        }
        @keyframes arrow2 {
          0%, 38%  { stroke-dashoffset: 40; }
          55%, 100% { stroke-dashoffset: 0; }
        }
        @keyframes crashPulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
        @keyframes selfLoop {
          0%, 49%  { stroke-dashoffset: 88; opacity: 0; }
          55%      { stroke-dashoffset: 88; opacity: 1; }
          75%      { stroke-dashoffset: 0; opacity: 1; }
          82%      { stroke-dashoffset: 0; opacity: 0.4; }
          100%     { stroke-dashoffset: 88; opacity: 0; }
        }
        @keyframes fixArrow {
          0%, 74%  { stroke-dashoffset: 50; opacity: 0; }
          82%, 96% { stroke-dashoffset: 0; opacity: 1; }
          100%     { stroke-dashoffset: 50; opacity: 0; }
        }
        @keyframes badgePulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.08); }
        }
        .pod-dot  { animation: podMove 7s ease-in-out infinite; }
        .arr1     { stroke-dasharray: 40; animation: arrow1 7s ease-in-out infinite; }
        .arr2     { stroke-dasharray: 40; animation: arrow2 7s ease-in-out infinite; }
        .crash-box { animation: crashPulse 1.2s ease-in-out infinite; }
        .self-loop { stroke-dasharray: 88; animation: selfLoop 7s ease-in-out infinite; }
        .fix-arr  { stroke-dasharray: 50; animation: fixArrow 7s ease-in-out infinite; }
        .badge    { animation: badgePulse 1.2s ease-in-out infinite; transform-origin: 283px 148px; }
      `}</style>

      {/* Background boxes */}
      <rect x="20"  y="70" width="90" height="50" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
      <rect x="145" y="70" width="90" height="50" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
      <rect x="270" y="70" width="90" height="50" rx="8" fill="#1e293b" stroke="#ef4444" strokeWidth="1.5" className="crash-box"/>

      {/* Box labels */}
      <text x="65"  y="100" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontFamily="monospace">Pending</text>
      <text x="190" y="100" textAnchor="middle" fill="#4ade80" fontSize="12" fontFamily="monospace">Running</text>
      <text x="315" y="92"  textAnchor="middle" fill="#ef4444" fontSize="10" fontFamily="monospace">CrashLoop</text>
      <text x="315" y="108" textAnchor="middle" fill="#ef4444" fontSize="10" fontFamily="monospace">BackOff</text>

      {/* Forward arrows */}
      <line x1="112" y1="95" x2="143" y2="95" stroke="#60a5fa" strokeWidth="1.5" className="arr1"/>
      <polygon points="143,90 151,95 143,100" fill="#60a5fa" opacity="0.8"/>
      <line x1="237" y1="95" x2="268" y2="95" stroke="#ef4444" strokeWidth="1.5" className="arr2"/>
      <polygon points="268,90 276,95 268,100" fill="#ef4444" opacity="0.8"/>

      {/* Self-loop arc on CrashLoopBackOff */}
      <path d="M 285 70 A 28 28 0 1 1 345 70" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="88" className="self-loop"/>
      <polygon points="345,70 352,62 355,72" fill="#ef4444" opacity="0.85"/>
      <text x="315" y="42" textAnchor="middle" fill="#ef4444" fontSize="7" fontFamily="monospace">exponential backoff</text>
      <text x="315" y="52" textAnchor="middle" fill="#ef4444" fontSize="7" fontFamily="monospace">restart</text>

      {/* Dashed "fix" arrow CrashLoopBackOff → Running */}
      <path d="M 270 115 Q 230 155 235 115" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="5,4" className="fix-arr"/>
      <polygon points="232,116 237,107 242,116" fill="#4ade80"/>
      <text x="237" y="148" textAnchor="middle" fill="#4ade80" fontSize="7.5" fontFamily="monospace">fix → Running</text>

      {/* Animated pod icon */}
      <g className="pod-dot" style={{transformOrigin: '0 0'}}>
        <circle cx="65" cy="95" r="10" fill="#326CE5" opacity="0.9"/>
        <text x="65" y="99" textAnchor="middle" fill="white" fontSize="10">⬡</text>
      </g>

      {/* Red badge */}
      <g className="badge">
        <rect x="248" y="137" width="70" height="18" rx="4" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1"/>
        <text x="283" y="150" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="monospace">✗ 0/1 Ready</text>
      </g>

      {/* Backoff annotation */}
      <text x="65" y="170" textAnchor="middle" fill="#475569" fontSize="6.5" fontFamily="monospace">kubelet retries: 10s→20s→40s→5min</text>

      {/* Title */}
      <text x="190" y="30" textAnchor="middle" fill="#60a5fa" fontSize="13" fontWeight="bold" fontFamily="sans-serif">Pod Lifecycle</text>
      <text x="190" y="47" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="sans-serif">CrashLoopBackOff → fix env → Running</text>
    </svg>
  );
}
