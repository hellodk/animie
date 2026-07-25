export default function StackTrace() {
  return (
    <svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Stack Trace diagram">
      <style>{`
        @keyframes stackBuild {
          0%,5%   { opacity: 0; transform: translateY(-8px); }
          15%,60% { opacity: 1; transform: translateY(0); }
          75%,100%{ opacity: 0; transform: translateY(8px); }
        }
        @keyframes stackBuild2 {
          0%,20%  { opacity: 0; transform: translateY(-8px); }
          30%,60% { opacity: 1; transform: translateY(0); }
          75%,100%{ opacity: 0; transform: translateY(8px); }
        }
        @keyframes stackBuild3 {
          0%,35%  { opacity: 0; transform: translateY(-8px); }
          45%,60% { opacity: 1; transform: translateY(0); }
          75%,100%{ opacity: 0; transform: translateY(8px); }
        }
        @keyframes revertFlash {
          0%,60%  { opacity: 0; }
          65%,70% { opacity: 1; }
          72%,78% { opacity: 0; }
          80%,90% { opacity: 1; }
          95%,100%{ opacity: 0; }
        }
        @keyframes collapse {
          0%,60%  { transform: scaleY(1); opacity: 1; }
          80%,100%{ transform: scaleY(0); opacity: 0; }
        }
        .frame-a { animation: stackBuild  3.5s ease-in-out infinite; transform-origin: 125px 75px; }
        .frame-b { animation: stackBuild2 3.5s ease-in-out infinite; transform-origin: 125px 115px; }
        .frame-c { animation: stackBuild3 3.5s ease-in-out infinite; transform-origin: 125px 155px; }
        .revert  { animation: revertFlash 3.5s ease-in-out infinite; }
        .collapse-all { animation: collapse 3.5s ease-in-out infinite; transform-origin: 125px 115px; }
      `}</style>

      <rect width="380" height="220" fill="#0f172a" rx="10"/>

      {/* Stack frames — stacking */}
      <g className="frame-a">
        <rect x="50" y="55" width="150" height="36" rx="6" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5"/>
        <text x="125" y="70" textAnchor="middle" fill="#93c5fd" fontSize="10" fontFamily="monospace">A: testWithdraw()</text>
        <text x="125" y="83" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace">vault.withdraw(1 ether)</text>
      </g>
      <g className="frame-b">
        <rect x="50" y="95" width="150" height="36" rx="6" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.5"/>
        <text x="125" y="110" textAnchor="middle" fill="#93c5fd" fontSize="10" fontFamily="monospace">B: withdraw()</text>
        <text x="125" y="123" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace">transfer(amt * 2)</text>
      </g>
      <g className="frame-c">
        <rect x="50" y="135" width="150" height="36" rx="6" fill="#1e293b" stroke="#ef4444" strokeWidth="2"/>
        <text x="125" y="150" textAnchor="middle" fill="#fca5a5" fontSize="10" fontFamily="monospace">C: assertEq</text>
        <text x="125" y="163" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace">REVERT — value mismatch</text>
      </g>

      {/* Revert flash overlay */}
      <g className="revert">
        <rect x="50" y="135" width="150" height="36" rx="6" fill="#7f1d1d" stroke="#ef4444" strokeWidth="2" opacity="0.8"/>
        <text x="125" y="157" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold" fontFamily="monospace">✗ REVERT</text>
      </g>

      {/* Right panel — trace output */}
      <rect x="218" y="50" width="145" height="130" rx="6" fill="#0d1117" stroke="#21262d" strokeWidth="1"/>
      <text x="228" y="68" fill="#60a5fa" fontSize="8" fontFamily="monospace">Trace:</text>
      <text x="228" y="82" fill="#94a3b8" fontSize="8" fontFamily="monospace">  [CALL] testWithdraw</text>
      <text x="228" y="96" fill="#94a3b8" fontSize="8" fontFamily="monospace">    [CALL] withdraw</text>
      <text x="228" y="110" fill="#94a3b8" fontSize="8" fontFamily="monospace">      [CALL] transfer</text>
      <text x="228" y="124" fill="#ef4444" fontSize="8" fontFamily="monospace">      ← 2000000000000000000</text>
      <text x="228" y="138" fill="#ef4444" fontSize="8" fontFamily="monospace">  assertEq:</text>
      <text x="228" y="152" fill="#ef4444" fontSize="8" fontFamily="monospace">    expected: 1e18</text>
      <text x="228" y="166" fill="#ef4444" fontSize="8" fontFamily="monospace">    actual:   2e18</text>

      <text x="190" y="25" textAnchor="middle" fill="#f97316" fontSize="13" fontWeight="bold" fontFamily="sans-serif">Stack Trace Reader</text>
      <text x="190" y="40" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="sans-serif">revert bubbles up — frames collapse</text>
    </svg>
  );
}
