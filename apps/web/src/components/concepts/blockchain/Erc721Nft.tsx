export default function Erc721Nft() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ERC-721 NFT mint diagram">
      <style>{`
        @keyframes mintAnim {
          0%, 20%  { opacity: 0; transform: scale(0.5); }
          35%, 60% { opacity: 1; transform: scale(1); }
          100%     { opacity: 1; transform: scale(1); }
        }
        @keyframes arrowGrow {
          0%, 25%  { stroke-dashoffset: 80; opacity: 0; }
          45%, 100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes zeroFade {
          0%, 30%  { opacity: 1; }
          40%, 100% { opacity: 0; }
        }
        @keyframes addrAppear {
          0%, 35%  { opacity: 0; }
          50%, 100% { opacity: 1; }
        }
        @keyframes nftGlow {
          0%, 34%  { filter: none; }
          35%, 60% { filter: drop-shadow(0 0 6px #f472b6); }
          61%, 100% { filter: none; }
        }
        @keyframes mintLabel {
          0%, 20%  { opacity: 0; }
          30%, 55% { opacity: 1; }
          65%, 100% { opacity: 0; }
        }
        .nft-token { animation: mintAnim 5s ease-in-out infinite; transform-origin: 190px 110px; }
        .arrow     { stroke-dasharray: 80; animation: arrowGrow 5s ease-in-out infinite; }
        .zero-addr { animation: zeroFade 5s ease-in-out infinite; }
        .real-addr { animation: addrAppear 5s ease-in-out infinite; }
        .nft-glow  { animation: nftGlow 5s ease-in-out infinite; }
        .mint-lbl  { animation: mintLabel 5s ease-in-out infinite; }
      `}</style>

      {/* NFT Contract box */}
      <rect x="130" y="30" width="120" height="80" rx="6" fill="#1e293b" stroke="#f472b6" strokeWidth="2"/>
      <text x="190" y="50" textAnchor="middle" fill="#f472b6" fontSize="10" fontWeight="bold" fontFamily="monospace">ArtQuest NFT</text>
      <text x="190" y="65" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">ERC-721</text>
      <line x1="138" y1="70" x2="242" y2="70" stroke="#334155" strokeWidth="1"/>
      <text x="140" y="82" fill="#64748b" fontSize="7.5" fontFamily="monospace">mint(to) → tokenId++</text>
      <text x="140" y="95" fill="#64748b" fontSize="7.5" fontFamily="monospace">ownerOf(id) → addr</text>
      <text x="140" y="108" fill="#64748b" fontSize="7.5" fontFamily="monospace">tokenURI(id) → url</text>

      {/* NFT token card — appears on mint */}
      <g className="nft-token">
        <g className="nft-glow">
          <rect x="145" y="135" width="90" height="60" rx="6" fill="#1e1027" stroke="#f472b6" strokeWidth="2"/>
          <text x="190" y="155" textAnchor="middle" fill="#f472b6" fontSize="9" fontWeight="bold" fontFamily="monospace">Token #1</text>
          <text x="190" y="168" textAnchor="middle" fontSize="18">🖼️</text>
          <text x="190" y="188" textAnchor="middle" fill="#94a3b8" fontSize="6.5" fontFamily="monospace">ArtQuest #1</text>
        </g>
      </g>

      {/* Mint label */}
      <g className="mint-lbl">
        <rect x="155" y="118" width="70" height="14" rx="3" fill="#4a044e" stroke="#f472b6" strokeWidth="1"/>
        <text x="190" y="128" textAnchor="middle" fill="#f472b6" fontSize="8" fontFamily="monospace">mint() called</text>
      </g>

      {/* Arrow from contract to wallet */}
      <line x1="238" y1="165" x2="280" y2="165" stroke="#4ade80" strokeWidth="1.5" className="arrow"/>
      <polygon points="280,160 288,165 280,170" fill="#4ade80"/>

      {/* Wallet ownership box */}
      <rect x="290" y="140" width="82" height="50" rx="6" fill="#1e293b" stroke="#4ade80" strokeWidth="1.5"/>
      <text x="331" y="158" textAnchor="middle" fill="#4ade80" fontSize="8" fontWeight="bold" fontFamily="monospace">Your Wallet</text>
      {/* Before mint: zero address */}
      <text x="331" y="172" textAnchor="middle" fill="#ef4444" fontSize="6.5" fontFamily="monospace" className="zero-addr">0x0000...0000</text>
      {/* After mint: real address */}
      <text x="331" y="172" textAnchor="middle" fill="#4ade80" fontSize="6.5" fontFamily="monospace" className="real-addr">0x742d...f44e</text>
      <text x="331" y="184" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="monospace">ownerOf(1)</text>

      {/* Title */}
      <text x="190" y="18" textAnchor="middle" fill="#f472b6" fontSize="12" fontWeight="bold" fontFamily="sans-serif">ERC-721 NFT Mint</text>
      <text x="190" y="210" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="sans-serif">mint() → ownerOf(1) transitions from 0x0 to your address</text>
    </svg>
  );
}
