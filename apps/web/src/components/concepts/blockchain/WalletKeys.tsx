export default function WalletKeys() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Wallet key derivation diagram">
      <style>{`
        @keyframes drawArrow1 {
          0%, 10%  { stroke-dashoffset: 50; opacity: 0; }
          25%, 100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes drawArrow2 {
          0%, 35%  { stroke-dashoffset: 50; opacity: 0; }
          50%, 100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes fadeBox1 {
          0%, 15%  { opacity: 0; transform: translateY(8px); }
          30%, 100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeBox2 {
          0%, 40%  { opacity: 0; transform: translateY(8px); }
          55%, 100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeBox3 {
          0%, 60%  { opacity: 0; transform: translateY(8px); }
          75%, 100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes addressType {
          0%, 60%   { width: 0; }
          75%, 100% { width: 100px; }
        }
        @keyframes lockPulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.15); }
        }
        .arr1  { stroke-dasharray: 50; animation: drawArrow1 5s ease-in-out infinite; }
        .arr2  { stroke-dasharray: 50; animation: drawArrow2 5s ease-in-out infinite; }
        .box1  { animation: fadeBox1 5s ease-in-out infinite; transform-origin: 0 0; }
        .box2  { animation: fadeBox2 5s ease-in-out infinite; transform-origin: 0 0; }
        .box3  { animation: fadeBox3 5s ease-in-out infinite; transform-origin: 0 0; }
        .lock  { animation: lockPulse 2s ease-in-out infinite; transform-origin: 55px 115px; }
      `}</style>

      {/* Step 1: Private Key */}
      <g className="box1">
        <rect x="10" y="70" width="120" height="60" rx="6" fill="#1e293b" stroke="#ef4444" strokeWidth="1.5"/>
        <text x="70" y="90" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="bold" fontFamily="monospace">Private Key</text>
        <text x="70" y="105" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">256-bit random</text>
        <text x="70" y="118" textAnchor="middle" fill="#f87171" fontSize="6.5" fontFamily="monospace">0x3a7f...c8d1</text>
      </g>
      {/* Lock icon */}
      <g className="lock">
        <text x="48" y="120" fill="#ef4444" fontSize="16">🔐</text>
      </g>

      {/* Arrow 1: Private→Public (secp256k1) */}
      <line x1="132" y1="100" x2="148" y2="100" stroke="#60a5fa" strokeWidth="1.5" className="arr1"/>
      <polygon points="148,95 156,100 148,105" fill="#60a5fa"/>
      <text x="142" y="94" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">secp256k1</text>

      {/* Step 2: Public Key */}
      <g className="box2">
        <rect x="155" y="70" width="120" height="60" rx="6" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.5"/>
        <text x="215" y="90" textAnchor="middle" fill="#60a5fa" fontSize="9" fontWeight="bold" fontFamily="monospace">Public Key</text>
        <text x="215" y="105" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">512-bit EC point</text>
        <text x="215" y="118" textAnchor="middle" fill="#93c5fd" fontSize="6.5" fontFamily="monospace">04 8f3c...a2b9</text>
      </g>

      {/* Arrow 2: Public→Address (Keccak-256) */}
      <line x1="277" y1="100" x2="293" y2="100" stroke="#4ade80" strokeWidth="1.5" className="arr2"/>
      <polygon points="293,95 301,100 293,105" fill="#4ade80"/>
      <text x="287" y="94" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">Keccak256</text>

      {/* Step 3: Address */}
      <g className="box3">
        <rect x="300" y="70" width="72" height="60" rx="6" fill="#1e293b" stroke="#4ade80" strokeWidth="1.5"/>
        <text x="336" y="90" textAnchor="middle" fill="#4ade80" fontSize="9" fontWeight="bold" fontFamily="monospace">Address</text>
        <text x="336" y="105" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">last 20 bytes</text>
        <text x="336" y="118" textAnchor="middle" fill="#6ee7b7" fontSize="6" fontFamily="monospace">0x742d...</text>
      </g>

      {/* Flow labels */}
      <text x="190" y="155" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace">Private key → multiplied by G → Public key → Keccak-256 → Address</text>
      <text x="190" y="170" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="sans-serif">One-way: address cannot be reversed to private key</text>

      {/* Title */}
      <text x="190" y="25" textAnchor="middle" fill="#60a5fa" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Wallet Key Derivation</text>
      <text x="190" y="42" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="sans-serif">secp256k1 × G  →  Keccak-256  →  0x address</text>
    </svg>
  );
}
