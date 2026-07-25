export default function AccessControl() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Access Control diagram">
      <style>{`
        @keyframes badUserSlip {
          0%,10%  { transform: translateX(0); opacity: 1; }
          35%,45% { transform: translateX(130px); opacity: 1; }
          55%,60% { transform: translateX(130px); opacity: 0; }
          61%,100%{ transform: translateX(0); opacity: 1; }
        }
        @keyframes lockGap {
          0%,5%   { d: path("M 195 90 L 195 140"); stroke: #ef4444; }
          60%,100%{ stroke: #ef4444; }
        }
        @keyframes fixedLock {
          0%,60%  { opacity: 0; }
          70%,100%{ opacity: 1; }
        }
        @keyframes blockedUser {
          0%,60%  { opacity: 0; }
          68%,75% { transform: translateX(40px); opacity: 1; }
          80%,100%{ transform: translateX(0); opacity: 1; }
        }
        @keyframes gapPulse {
          0%,50%  { opacity: 1; }
          55%,60% { opacity: 0; }
          65%,100%{ opacity: 0; }
        }
        .bad-user    { animation: badUserSlip 5s ease-in-out infinite; transform-origin: 55px 120px; }
        .lock-gap    { animation: gapPulse 5s ease-in-out infinite; }
        .fixed-lock  { animation: fixedLock 5s ease-in-out infinite; }
        .blocked     { animation: blockedUser 5s ease-in-out infinite; transform-origin: 55px 120px; }
      `}</style>

      <rect width="380" height="220" fill="#0f172a" rx="10"/>

      {/* Function box (right) */}
      <rect x="245" y="85" width="115" height="55" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
      <text x="302" y="108" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">withdrawAll()</text>
      <text x="302" y="123" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace">admin function</text>

      {/* Middle: broken lock (gap) */}
      <g className="lock-gap">
        <rect x="178" y="88" width="34" height="30" rx="4" fill="#1c0a0a" stroke="#ef4444" strokeWidth="1.5"/>
        <text x="195" y="108" textAnchor="middle" fill="#ef4444" fontSize="16">🔓</text>
        <rect x="188" y="118" width="14" height="12" rx="2" fill="#1c0a0a" stroke="#ef4444" strokeWidth="1"/>
        {/* Gap — visual crack */}
        <line x1="195" y1="88" x2="195" y2="80" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,2"/>
        <text x="195" y="145" textAnchor="middle" fill="#ef4444" fontSize="7" fontFamily="monospace">require(sender != owner)</text>
        <text x="195" y="155" textAnchor="middle" fill="#fca5a5" fontSize="7" fontFamily="monospace">BUG: inverted!</text>
      </g>

      {/* Fixed lock */}
      <g className="fixed-lock">
        <rect x="178" y="88" width="34" height="30" rx="4" fill="#052e16" stroke="#4ade80" strokeWidth="1.5"/>
        <text x="195" y="108" textAnchor="middle" fill="#4ade80" fontSize="16">🔒</text>
        <rect x="188" y="118" width="14" height="12" rx="2" fill="#052e16" stroke="#4ade80" strokeWidth="1"/>
        <text x="195" y="145" textAnchor="middle" fill="#4ade80" fontSize="7" fontFamily="monospace">require(sender == owner)</text>
        <text x="195" y="155" textAnchor="middle" fill="#4ade80" fontSize="7" fontFamily="monospace">FIXED</text>
      </g>

      {/* Unauthorized user slipping through */}
      <g className="bad-user">
        <circle cx="55" cy="115" r="16" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5"/>
        <text x="55" y="112" textAnchor="middle" fill="#fca5a5" fontSize="9" fontFamily="monospace">0xBAD</text>
        <text x="55" y="124" textAnchor="middle" fill="#ef4444" fontSize="8">👤</text>
      </g>

      {/* Blocked user (after fix) */}
      <g className="blocked">
        <circle cx="55" cy="115" r="16" fill="#1e293b" stroke="#4ade80" strokeWidth="1.5"/>
        <text x="55" y="112" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">0xBAD</text>
        <text x="55" y="124" textAnchor="middle" fill="#94a3b8" fontSize="8">👤</text>
        <line x1="40" y1="100" x2="70" y2="130" stroke="#ef4444" strokeWidth="3"/>
        <line x1="70" y1="100" x2="40" y2="130" stroke="#ef4444" strokeWidth="3"/>
      </g>

      {/* Owner user (always present) */}
      <circle cx="55" cy="165" r="16" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.5"/>
      <text x="55" y="162" textAnchor="middle" fill="#93c5fd" fontSize="9" fontFamily="monospace">owner</text>
      <text x="55" y="174" textAnchor="middle" fill="#60a5fa" fontSize="8">👑</text>

      <text x="190" y="25" textAnchor="middle" fill="#f97316" fontSize="13" fontWeight="bold" fontFamily="sans-serif">Access Control Bug</text>
      <text x="190" y="40" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="sans-serif">inverted onlyOwner — fix the require condition</text>
    </svg>
  );
}
