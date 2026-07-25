export default function ForgeTest() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Forge Test diagram">
      <style>{`
        @keyframes runTest {
          0%,10%  { opacity: 0; transform: translateY(4px); }
          20%,90% { opacity: 1; transform: translateY(0px); }
          95%,100%{ opacity: 0; transform: translateY(-4px); }
        }
        @keyframes outcomeFlash {
          0%,49% { opacity: 0; }
          50%,100%{ opacity: 1; }
        }
        @keyframes consoleLine {
          0%,30%  { opacity: 0; }
          50%,100%{ opacity: 1; }
        }
        @keyframes consoleLine2 {
          0%,50%  { opacity: 0; }
          70%,100%{ opacity: 1; }
        }
        @keyframes consoleLine3 {
          0%,65%  { opacity: 0; }
          85%,100%{ opacity: 1; }
        }
        @keyframes assertPulse {
          0%,40%  { fill: #60a5fa; }
          55%,65% { fill: #fbbf24; }
          75%,100%{ fill: #4ade80; }
        }
        .test-box   { animation: runTest 3s ease-in-out infinite; }
        .outcome    { animation: outcomeFlash 3s ease-in-out infinite; }
        .cline1     { animation: consoleLine  3s ease-in-out infinite; }
        .cline2     { animation: consoleLine2 3s ease-in-out infinite; }
        .cline3     { animation: consoleLine3 3s ease-in-out infinite; }
        .assert-txt { animation: assertPulse  3s ease-in-out infinite; }
      `}</style>

      {/* Background */}
      <rect width="380" height="220" fill="#0f172a" rx="10"/>

      {/* Test function box */}
      <rect x="20" y="50" width="200" height="100" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
      <text x="30" y="72" fill="#60a5fa" fontSize="10" fontFamily="monospace">function testAdd() public {'{'}  </text>
      <text x="40" y="88" fill="#e2e8f0" fontSize="10" fontFamily="monospace">uint r = lib.add(2,3);</text>
      <text x="40" y="104" fontFamily="monospace" fontSize="10" className="assert-txt">assertEq(r, 5);</text>
      <text x="30" y="120" fill="#60a5fa" fontSize="10" fontFamily="monospace">{'}'}</text>
      <rect x="20" y="50" width="200" height="100" rx="8" fill="none" stroke="#3b82f6" strokeWidth="1" className="test-box"/>

      {/* Arrow: test → outcome */}
      <line x1="222" y1="100" x2="258" y2="100" stroke="#475569" strokeWidth="1.5"/>
      <polygon points="258,95 266,100 258,105" fill="#475569"/>

      {/* Outcome: green pass */}
      <g className="outcome">
        <rect x="268" y="70" width="90" height="60" rx="8" fill="#052e16" stroke="#4ade80" strokeWidth="1.5"/>
        <text x="313" y="95" textAnchor="middle" fill="#4ade80" fontSize="22" fontFamily="monospace">✓</text>
        <text x="313" y="115" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="monospace">PASS</text>
      </g>

      {/* Console output lines */}
      <rect x="20" y="163" width="340" height="46" rx="5" fill="#0d1117" stroke="#21262d" strokeWidth="1"/>
      <text x="30" y="178" fill="#3c8eed" fontSize="9" fontFamily="monospace" className="cline1">$ forge test --match-test testAdd</text>
      <text x="30" y="191" fill="#4ade80" fontSize="9" fontFamily="monospace" className="cline2">Running 1 test for MathLibTest</text>
      <text x="30" y="204" fill="#4ade80" fontSize="9" fontFamily="monospace" className="cline3">[PASS] testAdd() (gas: 1823)</text>

      {/* Title */}
      <text x="190" y="25" textAnchor="middle" fill="#f97316" fontSize="13" fontWeight="bold" fontFamily="sans-serif">Forge Unit Test</text>
      <text x="190" y="40" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="sans-serif">write → assert → pass</text>
    </svg>
  );
}
