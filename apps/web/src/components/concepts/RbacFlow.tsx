export default function RbacFlow() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="RBAC Flow diagram">
      <style>{`
        @keyframes spoke1Draw {
          0%, 10%  { stroke-dashoffset: 60; opacity: 0; }
          30%, 100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes spoke2Draw {
          0%, 30%  { stroke-dashoffset: 55; opacity: 0; }
          50%, 100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes spoke3Draw {
          0%, 50%  { stroke-dashoffset: 65; opacity: 0; }
          70%, 100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes bindingGlow {
          0%, 69%  { filter: none; stroke: #fbbf24; }
          70%, 100% { filter: drop-shadow(0 0 4px #fbbf24); stroke: #fde68a; }
        }
        @keyframes checkFade {
          0%, 75%  { opacity: 0; }
          88%, 100% { opacity: 1; }
        }
        .sp1 { stroke-dasharray: 60; animation: spoke1Draw 5s ease-in-out infinite; }
        .sp2 { stroke-dasharray: 55; animation: spoke2Draw 5s ease-in-out infinite; }
        .sp3 { stroke-dasharray: 65; animation: spoke3Draw 5s ease-in-out infinite; }
        .rb-box { animation: bindingGlow 5s ease-in-out infinite; }
        .check   { animation: checkFade 5s ease-in-out infinite; }
      `}</style>

      {/* ── Center: RoleBinding ── */}
      <rect x="148" y="85" width="85" height="50" rx="8" fill="#1e293b" strokeWidth="2" className="rb-box" stroke="#fbbf24"/>
      {/* Chain-link icon: two overlapping circles */}
      <circle cx="169" cy="100" r="5" fill="none" stroke="#fbbf24" strokeWidth="1.5"/>
      <circle cx="177" cy="100" r="5" fill="none" stroke="#fbbf24" strokeWidth="1.5"/>
      <text x="190" y="114" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold" fontFamily="monospace">RoleBinding</text>
      <text x="190" y="126" textAnchor="middle" fill="#94a3b8" fontSize="6.5" fontFamily="monospace">ci-pod-reader</text>

      {/* ── Left spoke: ServiceAccount ── */}
      {/* Line RoleBinding ← SA (arrow points to RoleBinding) */}
      <line x1="68" y1="110" x2="146" y2="110" stroke="#60a5fa" strokeWidth="1.8" className="sp1"/>
      <polygon points="146,105 148,110 146,115" fill="#60a5fa"/>
      {/* SA box */}
      <rect x="10" y="85" width="75" height="50" rx="7" fill="#1e293b" stroke="#326CE5" strokeWidth="1.5"/>
      {/* Person icon */}
      <circle cx="47" cy="98" r="5" fill="none" stroke="#60a5fa" strokeWidth="1.5"/>
      <rect x="37" y="104" width="20" height="8" rx="2" fill="none" stroke="#60a5fa" strokeWidth="1.5"/>
      <text x="47" y="122" textAnchor="middle" fill="#93c5fd" fontSize="7.5" fontFamily="monospace">ServiceAccount</text>
      <text x="47" y="131" textAnchor="middle" fill="#e2e8f0" fontSize="7" fontFamily="monospace">ci-bot</text>

      {/* ── Top spoke: Role ── */}
      {/* Line RoleBinding ← Role (arrow points to RoleBinding) */}
      <line x1="190" y1="48" x2="190" y2="83" stroke="#a78bfa" strokeWidth="1.8" className="sp2"/>
      <polygon points="185,83 190,85 195,83" fill="#a78bfa"/>
      {/* Role box */}
      <rect x="148" y="10" width="85" height="38" rx="7" fill="#1e293b" stroke="#7c3aed" strokeWidth="1.5"/>
      {/* Key icon */}
      <circle cx="167" cy="25" r="5" fill="none" stroke="#a78bfa" strokeWidth="1.5"/>
      <line x1="172" y1="25" x2="180" y2="25" stroke="#a78bfa" strokeWidth="1.5"/>
      <line x1="178" y1="25" x2="178" y2="29" stroke="#a78bfa" strokeWidth="1.5"/>
      <text x="215" y="22" fill="#c4b5fd" fontSize="7.5" fontFamily="monospace">Role</text>
      <text x="215" y="31" fill="#e2e8f0" fontSize="6.5" fontFamily="monospace">pod-reader</text>
      <text x="215" y="40" fill="#64748b" fontSize="6" fontFamily="monospace">[get, list]</text>

      {/* ── Right spoke: Resource / Namespace ── */}
      {/* Line RoleBinding → Resource (arrow points to Resource) */}
      <line x1="235" y1="110" x2="295" y2="110" stroke="#4ade80" strokeWidth="1.8" strokeDasharray="5,3" className="sp3"/>
      <polygon points="295,105 297,110 295,115" fill="#4ade80"/>
      {/* Resource box */}
      <rect x="297" y="85" width="75" height="50" rx="7" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
      {/* Box icon */}
      <rect x="310" y="91" width="10" height="10" rx="1" fill="none" stroke="#4ade80" strokeWidth="1.5"/>
      <line x1="310" y1="96" x2="320" y2="96" stroke="#4ade80" strokeWidth="1"/>
      <text x="335" y="102" fill="#86efac" fontSize="7" fontFamily="monospace">Namespace</text>
      <text x="335" y="111" fill="#94a3b8" fontSize="6.5" fontFamily="monospace">staging</text>
      <text x="335" y="120" fill="#86efac" fontSize="7" fontFamily="monospace">pods</text>
      <text x="335" y="129" fill="#94a3b8" fontSize="6" fontFamily="monospace">(get, list)</text>

      {/* ✓ Access Granted badge on right spoke */}
      <g className="check">
        <rect x="236" y="150" width="100" height="18" rx="4" fill="#14532d" stroke="#4ade80" strokeWidth="1"/>
        <text x="286" y="162" textAnchor="middle" fill="#4ade80" fontSize="8" fontFamily="monospace">✓ Access Granted</text>
      </g>

      {/* Title */}
      <text x="190" y="205" textAnchor="middle" fill="#60a5fa" fontSize="12" fontWeight="bold" fontFamily="sans-serif">RBAC Flow</text>
      <text x="190" y="217" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="sans-serif">RoleBinding links Subject + Role → grants access</text>
    </svg>
  );
}
