import type { Course } from '../types/course';
import type { Character } from '../types/game';
import type { Scenario } from '../types/scenario';

const crucibleScenarios: Scenario[] = [
  // ──────────────────────────────────────────────
  // BEGINNER — Test Fundamentals (difficulty 1-2)
  // ──────────────────────────────────────────────
  {
    id: 'crucible-s01-first-test',
    slug: 'first-test',
    name: 'Write Your First Test',
    category: 'testing',
    difficulty: 1,
    estimatedMinutes: 5,
    maxPoints: 100,
    description: 'A contract has a broken add() function. Write a Foundry unit test to catch it.',
    story: '🔥 **BROKEN ADD** — The `MathLib` contract\'s `add()` function silently overflows instead of reverting. Write a Foundry test that calls `add()` with large inputs and asserts the result is correct. `forge test -vvv` should turn green.',
    objectives: [
      'Inspect the MathLib contract to understand the bug in add()',
      'Write a Foundry test function testAdd() that triggers the overflow',
      'Run forge test --match-test testAdd and confirm the test catches the bug',
    ],
    initialClusterState: {
      namespaces: ['default'],
      currentNamespace: 'default',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'forge-project',
              namespace: 'default',
              labels: { status: 'test-missing', tool: 'forge' },
              annotations: { error: 'No tests found for MathLib' },
              creationTimestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
              uid: 'crucible-cm-001',
            },
            data: {
              'src/MathLib.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\ncontract MathLib {\n  // BUG: no overflow check\n  function add(uint256 a, uint256 b) external pure returns (uint256) {\n    unchecked { return a + b; }\n  }\n}',
              'test/MathLib.t.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\nimport "forge-std/Test.sol";\nimport "../src/MathLib.sol";\ncontract MathLibTest is Test {\n  // TODO: write testAdd()\n}',
            },
          },
        },
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'forge-runner',
              namespace: 'default',
              labels: { tool: 'forge', status: 'no-tests' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
              uid: 'crucible-pod-001',
            },
            spec: {
              containers: [{
                name: 'forge',
                image: 'ghcr.io/foundry-rs/foundry:latest',
                ports: [],
                env: [{ name: 'FORGE_STATUS', value: 'no-tests' }],
                envFrom: [],
              }],
            },
            status: {
              phase: 'Running',
              containerStatuses: [{
                name: 'forge',
                ready: true,
                restartCount: 0,
                state: 'running',
                image: 'ghcr.io/foundry-rs/foundry:latest',
              }],
              message: 'No tests found matching testAdd',
              reason: 'NoTests',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'custom',
      targetName: 'testAdd-passes',
      expectedValue: 'forge test --match-test testAdd',
    },
    hints: [
      { id: 'ch1-1', order: 1, text: 'Run `forge test -vvv` — you\'ll see "No tests found". You need to write a test function named testAdd.', pointPenalty: 20 },
      { id: 'ch1-2', order: 2, text: 'Add a test that expects the overflow to revert (or wrap). For code that should revert: `vm.expectRevert(); sm.addUnsafe(type(uint256).max, 1);`. For unchecked code that wraps silently: `assertEq(sm.addUnsafe(type(uint256).max, 1), 0)` — wrapped to 0 proves the overflow.', pointPenalty: 35 },
      { id: 'ch1-3', order: 3, text: 'Run `forge test --match-test testAdd`. The test should fail (catching the bug), then fix the contract to use `a + b` without `unchecked` so the test passes.', pointPenalty: 50 },
    ],
    solutionCommands: [
      'forge test -vvv',
      'forge test --match-test testAdd',
      'forge test --match-test testAdd -vvv',
    ],
    teacherNotes: 'Core concept: Foundry test structure, forge-std Test.sol, assertLt/assertEq. Teaches overflow safety and unchecked arithmetic.',
    conceptId: 'forge-test',
  },

  {
    id: 'crucible-s02-assertion-failure',
    slug: 'assertion-failure',
    name: 'Read the Stack Trace',
    category: 'testing',
    difficulty: 1,
    estimatedMinutes: 6,
    maxPoints: 100,
    description: 'A test is failing but the error is unclear. Use verbose output to understand the revert.',
    story: '📋 **CRYPTIC FAILURE** — `forge test` shows a test is failing but the output is minimal. Crank up the verbosity flags to get the full stack trace and identify the precise assertion that reverts.',
    objectives: [
      'Run forge test to see the initial failure output',
      'Use forge test -vvvv to get the full call stack and revert reason',
      'Identify the exact assertion (line and value) causing the failure',
    ],
    initialClusterState: {
      namespaces: ['default'],
      currentNamespace: 'default',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'forge-project',
              namespace: 'default',
              labels: { status: 'test-failing', tool: 'forge' },
              annotations: { error: 'assertion failed' },
              creationTimestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
              uid: 'crucible-cm-002',
            },
            data: {
              'src/Vault.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\ncontract Vault {\n  mapping(address=>uint) public balances;\n  function deposit() external payable { balances[msg.sender] += msg.value; }\n  function withdraw(uint amt) external {\n    require(balances[msg.sender] >= amt);\n    balances[msg.sender] -= amt;\n    // BUG: sends amt*2 instead of amt\n    payable(msg.sender).transfer(amt * 2);\n  }\n}',
              'test/Vault.t.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\nimport "forge-std/Test.sol";\nimport "../src/Vault.sol";\ncontract VaultTest is Test {\n  function testWithdraw() public {\n    Vault v = new Vault();\n    vm.deal(address(v), 10 ether);\n    vm.deal(address(this), 1 ether);\n    v.deposit{value: 1 ether}();\n    uint before = address(this).balance;\n    v.withdraw(1 ether);\n    assertEq(address(this).balance, before + 1 ether);\n  }\n  receive() external payable {}\n}',
            },
          },
        },
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'forge-runner',
              namespace: 'default',
              labels: { tool: 'forge', status: 'failing' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
              uid: 'crucible-pod-002',
            },
            spec: {
              containers: [{
                name: 'forge',
                image: 'ghcr.io/foundry-rs/foundry:latest',
                ports: [],
                env: [{ name: 'FORGE_STATUS', value: 'test-failing' }],
                envFrom: [],
              }],
            },
            status: {
              phase: 'CrashLoopBackOff',
              containerStatuses: [{
                name: 'forge',
                ready: false,
                restartCount: 1,
                state: 'waiting',
                stateReason: 'CrashLoopBackOff',
                image: 'ghcr.io/foundry-rs/foundry:latest',
              }],
              message: 'FAIL: testWithdraw — assertion failed',
              reason: 'TestFailed',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'custom',
      targetName: 'stack-trace-identified',
      expectedValue: 'forge test -vvvv',
    },
    hints: [
      { id: 'ch2-1', order: 1, text: 'Run `forge test -vvvv` — the extra v flags show the full call trace including the exact revert reason and values.', pointPenalty: 20 },
      { id: 'ch2-2', order: 2, text: 'Look at the assertEq output. It shows "expected" vs "actual" values. The balance is higher than expected — the contract sends too much ETH.', pointPenalty: 35 },
      { id: 'ch2-3', order: 3, text: 'The bug is `amt * 2` in transfer. Fix to `payable(msg.sender).transfer(amt)` then run `forge test`.', pointPenalty: 50 },
    ],
    solutionCommands: [
      'forge test',
      'forge test -vvvv',
      'forge debug --debug testWithdraw',
    ],
    teacherNotes: 'Teaches verbosity flags (-v through -vvvv), reading forge stack traces, assertEq expected/actual output format.',
    conceptId: 'stack-trace',
  },

  {
    id: 'crucible-s03-gas-snapshot',
    slug: 'gas-snapshot',
    name: 'Gas Snapshot Regression',
    category: 'testing',
    difficulty: 2,
    estimatedMinutes: 8,
    maxPoints: 150,
    description: 'A refactor increased gas usage. Run a gas snapshot, find the regression.',
    story: '⛽ **GAS REGRESSION** — A refactor landed in `TokenSwap` last night. CI is red because the gas snapshot diff exceeds the budget. Run `forge snapshot` to capture the new baseline and `--diff` to identify which function regressed.',
    objectives: [
      'Run forge snapshot to generate a .gas-snapshot file',
      'Run forge snapshot --diff to compare against the stored baseline',
      'Identify the function whose gas usage increased and by how much',
    ],
    initialClusterState: {
      namespaces: ['default'],
      currentNamespace: 'default',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'forge-project',
              namespace: 'default',
              labels: { status: 'gas-regression', tool: 'forge' },
              annotations: { error: 'gas usage increased by 45000 in swap()' },
              creationTimestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
              uid: 'crucible-cm-003',
            },
            data: {
              '.gas-snapshot': 'TokenSwapTest:testSwap() (gas: 32000)\nTokenSwapTest:testDeposit() (gas: 21000)',
              'src/TokenSwap.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\ncontract TokenSwap {\n  mapping(address=>uint) public balances;\n  address[] public holders; // REGRESSION: unbounded array added\n  function swap(address to, uint amt) external {\n    require(balances[msg.sender] >= amt);\n    balances[msg.sender] -= amt;\n    balances[to] += amt;\n    holders.push(msg.sender); // BUG: O(n) storage growth\n  }\n  function deposit() external payable { balances[msg.sender] += msg.value; }\n}',
            },
          },
        },
        {
          kind: 'Deployment',
          spec: {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
              name: 'forge-ci',
              namespace: 'default',
              labels: { tool: 'forge', status: 'gas-fail' },
              annotations: { 'gas-diff': '+45000 in swap()' },
              creationTimestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
              uid: 'crucible-deploy-001',
            },
            spec: {
              replicas: 0,
              selector: { matchLabels: { tool: 'forge' } },
              template: {
                metadata: { labels: { tool: 'forge' }, annotations: {} },
                spec: {
                  containers: [{
                    name: 'forge',
                    image: 'ghcr.io/foundry-rs/foundry:latest',
                    ports: [],
                    env: [{ name: 'CI_STATUS', value: 'gas-regression' }],
                    envFrom: [],
                  }],
                },
              },
            },
            status: {
              replicas: 0,
              readyReplicas: 0,
              availableReplicas: 0,
              unavailableReplicas: 0,
              conditions: [{ type: 'Available', status: 'False', message: 'Gas snapshot regression detected' }],
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'custom',
      targetName: 'gas-regression-identified',
      expectedValue: 'forge snapshot --diff',
    },
    hints: [
      { id: 'ch3-1', order: 1, text: 'Run `forge snapshot` to create a fresh `.gas-snapshot` file with current gas costs.', pointPenalty: 20 },
      { id: 'ch3-2', order: 2, text: 'Run `forge snapshot --diff` to compare the new snapshot against the old one. A "+" means gas increased.', pointPenalty: 35 },
      { id: 'ch3-3', order: 3, text: 'The `swap()` function regressed because `holders.push()` grows storage on every call. Remove the push or use a mapping instead.', pointPenalty: 50 },
    ],
    solutionCommands: [
      'forge snapshot',
      'forge snapshot --diff',
      'forge snapshot --check',
    ],
    teacherNotes: 'Teaches: forge snapshot, gas regression CI workflows, the cost of unbounded storage arrays in Solidity.',
    conceptId: 'gas-snapshot',
  },

  // ──────────────────────────────────────────────
  // INTERMEDIATE — Fuzzing (difficulty 2-3)
  // ──────────────────────────────────────────────
  {
    id: 'crucible-s04-fuzz-basic',
    slug: 'fuzz-basic',
    name: 'Your First Fuzz Test',
    category: 'fuzzing',
    difficulty: 2,
    estimatedMinutes: 8,
    maxPoints: 150,
    description: 'A uint overflow bug only triggers on specific inputs. A fuzz test finds it automatically.',
    story: '🎲 **HIDDEN OVERFLOW** — The `SafeMath` contract has a subtle bug that only surfaces when `a + b > type(uint128).max`. Normal unit tests with fixed values never hit it. Write a fuzz test and let Foundry find the counterexample.',
    objectives: [
      'Write a fuzz test that takes (uint128 a, uint128 b) as parameters',
      'Run forge test --fuzz-runs 1000 to let the fuzzer explore inputs',
      'Observe the counterexample Foundry produces and understand the bug',
    ],
    initialClusterState: {
      namespaces: ['default'],
      currentNamespace: 'default',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'forge-project',
              namespace: 'default',
              labels: { status: 'fuzz-needed', tool: 'forge' },
              annotations: { hint: 'Only fuzz testing will find this' },
              creationTimestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
              uid: 'crucible-cm-004',
            },
            data: {
              'src/SafeMath.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\ncontract SafeMath {\n  // BUG: casts to uint128 before adding — truncates!\n  function add(uint128 a, uint128 b) external pure returns (uint256) {\n    return uint256(a) + uint256(b); // actually fine\n  }\n  function addUnsafe(uint128 a, uint128 b) external pure returns (uint128) {\n    unchecked { return a + b; } // OVERFLOW BUG\n  }\n}',
              'test/SafeMath.t.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\nimport "forge-std/Test.sol";\nimport "../src/SafeMath.sol";\ncontract SafeMathTest is Test {\n  SafeMath sm = new SafeMath();\n  // TODO: write fuzz test — function testFuzz_addUnsafe(uint128 a, uint128 b) public\n}',
            },
          },
        },
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'forge-fuzzer',
              namespace: 'default',
              labels: { tool: 'forge', status: 'awaiting-fuzz' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
              uid: 'crucible-pod-004',
            },
            spec: {
              containers: [{
                name: 'forge',
                image: 'ghcr.io/foundry-rs/foundry:latest',
                ports: [],
                env: [{ name: 'FORGE_STATUS', value: 'awaiting-fuzz' }],
                envFrom: [],
              }],
            },
            status: {
              phase: 'Running',
              containerStatuses: [{
                name: 'forge',
                ready: true,
                restartCount: 0,
                state: 'running',
                image: 'ghcr.io/foundry-rs/foundry:latest',
              }],
              message: 'Waiting for fuzz test',
              reason: 'Pending',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'custom',
      targetName: 'fuzzer-counterexample',
      expectedValue: 'forge test --fuzz-runs 1000',
    },
    hints: [
      { id: 'ch4-1', order: 1, text: 'Fuzz tests in Foundry use typed parameters: `function testFuzz_addUnsafe(uint128 a, uint128 b) public`. Foundry auto-generates random inputs.', pointPenalty: 20 },
      { id: 'ch4-2', order: 2, text: 'Inside the fuzz test, assert: `uint256 expected = uint256(a) + uint256(b); assertEq(uint256(sm.addUnsafe(a, b)), expected);`', pointPenalty: 35 },
      { id: 'ch4-3', order: 3, text: 'Run `forge test --fuzz-runs 1000`. Foundry will print a counterexample like `[FAIL: counterexample: a=255, b=1]` showing the overflow input.', pointPenalty: 50 },
    ],
    solutionCommands: [
      'forge test --fuzz-runs 1000',
      'forge test --fuzz-runs 5000 -vvv',
    ],
    teacherNotes: 'Core fuzzing concept: property-based testing, counterexample shrinking, uint overflow detection. Compare with unit tests.',
    conceptId: 'fuzz-testing',
  },

  {
    id: 'crucible-s05-fuzz-assumptions',
    slug: 'fuzz-assumptions',
    name: 'Bound Your Inputs',
    category: 'fuzzing',
    difficulty: 2,
    estimatedMinutes: 10,
    maxPoints: 150,
    description: 'A fuzz test fails on trivial edge cases (input=0). Use vm.assume() and bound() to constrain.',
    story: '🎯 **NOISY FUZZER** — Your fuzz test keeps failing with `input=0` which is a meaningless edge case for this function. Learn to guide the fuzzer using `vm.assume()` to skip trivial inputs and `bound()` to keep values in a meaningful range.',
    objectives: [
      'Observe the fuzz test failing on input=0',
      'Add vm.assume(a > 0 && b > 0) to skip zero inputs',
      'Use bound(a, 1, 1000) to constrain the input range meaningfully',
    ],
    initialClusterState: {
      namespaces: ['default'],
      currentNamespace: 'default',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'forge-project',
              namespace: 'default',
              labels: { status: 'noisy-fuzz', tool: 'forge' },
              annotations: { error: 'vm.assume or bound needed' },
              creationTimestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
              uid: 'crucible-cm-005',
            },
            data: {
              'src/Divider.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\ncontract Divider {\n  function divide(uint256 a, uint256 b) external pure returns (uint256) {\n    require(b > 0, "div by zero");\n    return a / b;\n  }\n}',
              'test/Divider.t.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\nimport "forge-std/Test.sol";\nimport "../src/Divider.sol";\ncontract DividerTest is Test {\n  Divider d = new Divider();\n  function testFuzz_divide(uint256 a, uint256 b) public {\n    // PROBLEM: b can be 0, causing revert — use vm.assume or bound\n    uint256 result = d.divide(a, b);\n    assertGe(result, 0);\n  }\n}',
            },
          },
        },
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'forge-fuzzer',
              namespace: 'default',
              labels: { tool: 'forge', status: 'noisy-fuzz' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
              uid: 'crucible-pod-005',
            },
            spec: {
              containers: [{
                name: 'forge',
                image: 'ghcr.io/foundry-rs/foundry:latest',
                ports: [],
                env: [{ name: 'FORGE_STATUS', value: 'noisy-fuzz' }],
                envFrom: [],
              }],
            },
            status: {
              phase: 'CrashLoopBackOff',
              containerStatuses: [{
                name: 'forge',
                ready: false,
                restartCount: 2,
                state: 'waiting',
                stateReason: 'CrashLoopBackOff',
                image: 'ghcr.io/foundry-rs/foundry:latest',
              }],
              message: 'FAIL: testFuzz_divide — counterexample: b=0 (div by zero)',
              reason: 'TestFailed',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'custom',
      targetName: 'fuzz-bounded',
      expectedValue: 'forge test',
    },
    hints: [
      { id: 'ch5-1', order: 1, text: '`vm.assume(b > 0)` tells the fuzzer to skip any run where b is zero — Foundry discards that run and generates a new input.', pointPenalty: 20 },
      { id: 'ch5-2', order: 2, text: '`bound(b, 1, type(uint256).max)` is better — it actively maps the random input into the valid range instead of discarding runs.', pointPenalty: 35 },
      { id: 'ch5-3', order: 3, text: 'Add `b = bound(b, 1, 1e18);` before calling d.divide(). This keeps b meaningful and avoids div-by-zero. Then run `forge test`.', pointPenalty: 50 },
    ],
    solutionCommands: [
      'forge test',
      'forge test -vvv',
    ],
    teacherNotes: 'Teaches: vm.assume vs bound(), input filtering strategy, avoiding noisy fuzz failures. bound() is preferred over assume().',
    conceptId: 'fuzz-bounds',
  },

  {
    id: 'crucible-s06-invariant-setup',
    slug: 'invariant-setup',
    name: 'Define an Invariant',
    category: 'fuzzing',
    difficulty: 3,
    estimatedMinutes: 12,
    maxPoints: 200,
    description: 'A token contract must always have totalSupply == sum(balances). Write an invariant test.',
    story: '⚖️ **SUPPLY INVARIANT** — A token contract\'s `mint()` and `burn()` functions must never break the invariant: `totalSupply == sum of all balances`. Write an invariant test that Foundry will call after every random sequence of transactions.',
    objectives: [
      'Create an invariant handler contract that calls mint/burn/transfer randomly',
      'Write an invariant_ function asserting totalSupply == sum(balances)',
      'Run forge test --match-contract Invariant and watch the invariant hold',
    ],
    initialClusterState: {
      namespaces: ['default'],
      currentNamespace: 'default',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'forge-project',
              namespace: 'default',
              labels: { status: 'invariant-needed', tool: 'forge' },
              annotations: { hint: 'Use invariant_ prefix for invariant test functions' },
              creationTimestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
              uid: 'crucible-cm-006',
            },
            data: {
              'src/Token.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\ncontract Token {\n  mapping(address=>uint) public balanceOf;\n  uint public totalSupply;\n  function mint(address to, uint amt) external { balanceOf[to] += amt; totalSupply += amt; }\n  function burn(address from, uint amt) external {\n    require(balanceOf[from] >= amt);\n    balanceOf[from] -= amt;\n    totalSupply -= amt;\n  }\n}',
              'test/Token.invariant.t.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\nimport "forge-std/Test.sol";\nimport "../src/Token.sol";\ncontract TokenInvariantTest is Test {\n  Token token;\n  address[] users;\n  function setUp() public {\n    token = new Token();\n    users = [address(1), address(2), address(3)];\n  }\n  // TODO: write invariant_totalSupply()\n}',
            },
          },
        },
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'forge-invariant',
              namespace: 'default',
              labels: { tool: 'forge', status: 'invariant-needed' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
              uid: 'crucible-pod-006',
            },
            spec: {
              containers: [{
                name: 'forge',
                image: 'ghcr.io/foundry-rs/foundry:latest',
                ports: [],
                env: [{ name: 'FORGE_STATUS', value: 'invariant-needed' }],
                envFrom: [],
              }],
            },
            status: {
              phase: 'Running',
              containerStatuses: [{
                name: 'forge',
                ready: true,
                restartCount: 0,
                state: 'running',
                image: 'ghcr.io/foundry-rs/foundry:latest',
              }],
              message: 'No invariant tests found',
              reason: 'Pending',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'custom',
      targetName: 'invariant-holds',
      expectedValue: 'forge test --match-contract Invariant',
    },
    hints: [
      { id: 'ch6-1', order: 1, text: 'Invariant test functions must be prefixed with `invariant_`. Foundry calls them after every random call sequence.', pointPenalty: 20 },
      { id: 'ch6-2', order: 2, text: 'Write: `function invariant_totalSupply() public { uint sum; for(uint i; i<users.length; i++) sum += token.balanceOf(users[i]); assertEq(token.totalSupply(), sum); }`', pointPenalty: 35 },
      { id: 'ch6-3', order: 3, text: 'Add random callers with `targetContract(address(this))` and write handler functions like `function mint(address to, uint amt)` that the invariant runner will call randomly.', pointPenalty: 50 },
    ],
    solutionCommands: [
      'forge test --match-contract Invariant',
      'forge test --match-contract Invariant -vvv',
    ],
    teacherNotes: 'Introduces invariant testing: stateful fuzzing, handler contracts, targetContract/targetSelector. Key for DeFi protocol security.',
    conceptId: 'invariant-testing',
  },

  // ──────────────────────────────────────────────
  // ADVANCED — Exploit Writing (difficulty 3-4)
  // ──────────────────────────────────────────────
  {
    id: 'crucible-s07-reentrancy-exploit',
    slug: 'reentrancy-exploit',
    name: 'Exploit Reentrancy',
    category: 'security',
    difficulty: 3,
    estimatedMinutes: 15,
    maxPoints: 250,
    description: 'Write a Foundry exploit test for a classic reentrancy-vulnerable contract.',
    story: '⚔️ **DRAIN THE VAULT** — The `EtherVault` contract is vulnerable to reentrancy: it sends ETH before updating the balance. Write an `Attacker` contract with a fallback function that re-enters `withdraw()`, and drain all ETH from the vault.',
    objectives: [
      'Study the EtherVault contract and identify the reentrancy vulnerability',
      'Write an Attacker contract with a malicious fallback that re-enters withdraw()',
      'Write testExploit() — run forge test -vvvv --match-test testExploit to drain the vault',
    ],
    initialClusterState: {
      namespaces: ['default'],
      currentNamespace: 'default',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'forge-project',
              namespace: 'default',
              labels: { status: 'exploit-lab', tool: 'forge' },
              annotations: { vulnerability: 'reentrancy' },
              creationTimestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              uid: 'crucible-cm-007',
            },
            data: {
              'src/EtherVault.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\ncontract EtherVault {\n  mapping(address=>uint) public balances;\n  function deposit() external payable { balances[msg.sender] += msg.value; }\n  function withdraw() external {\n    uint bal = balances[msg.sender];\n    require(bal > 0);\n    // VULNERABLE: sends ETH before updating balance\n    (bool ok,) = msg.sender.call{value: bal}("");\n    require(ok);\n    balances[msg.sender] = 0; // too late!\n  }\n}',
              'test/Exploit.t.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\nimport "forge-std/Test.sol";\nimport "../src/EtherVault.sol";\n// TODO: write Attacker contract and testExploit()',
            },
          },
        },
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'forge-exploit',
              namespace: 'default',
              labels: { tool: 'forge', status: 'exploit-lab' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              uid: 'crucible-pod-007',
            },
            spec: {
              containers: [{
                name: 'forge',
                image: 'ghcr.io/foundry-rs/foundry:latest',
                ports: [],
                env: [{ name: 'FORGE_STATUS', value: 'exploit-lab' }],
                envFrom: [],
              }],
            },
            status: {
              phase: 'Running',
              containerStatuses: [{
                name: 'forge',
                ready: true,
                restartCount: 0,
                state: 'running',
                image: 'ghcr.io/foundry-rs/foundry:latest',
              }],
              message: 'Exploit lab ready — write the attacker',
              reason: 'Pending',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'custom',
      targetName: 'vault-drained',
      expectedValue: 'forge test -vvvv --match-test testExploit',
    },
    hints: [
      { id: 'ch7-1', order: 1, text: 'Create an `Attacker` contract. Its `attack()` deposits 1 ETH, then calls `vault.withdraw()`. The `receive()` function re-enters `vault.withdraw()` if vault has balance.', pointPenalty: 20 },
      { id: 'ch7-2', order: 2, text: 'In `testExploit()`: deploy vault with 10 ETH, deploy attacker with 1 ETH, call `attacker.attack()`, then `assertEq(address(vault).balance, 0)`.', pointPenalty: 35 },
      { id: 'ch7-3', order: 3, text: 'Use `vm.deal(address(vault), 10 ether)` to fund the vault, and `vm.deal(address(attacker), 1 ether)` to fund the attacker in setUp().', pointPenalty: 50 },
    ],
    solutionCommands: [
      'forge test -vvvv --match-test testExploit',
      'forge test --match-contract ExploitTest -vvvv',
    ],
    teacherNotes: 'Classic reentrancy exploit. Teaches: checks-effects-interactions, ReentrancyGuard, writing attacker contracts in Foundry. High impact scenario.',
    conceptId: 'reentrancy-exploit',
  },

  {
    id: 'crucible-s08-selfdestruct',
    slug: 'selfdestruct',
    name: 'Selfdestruct Force-Feed',
    category: 'security',
    difficulty: 3,
    estimatedMinutes: 12,
    maxPoints: 200,
    description: 'A contract relies on address(this).balance for invariants. Force-feed ETH via selfdestruct.',
    story: '💣 **FORCE FEED** — The `EtherGame` contract uses `address(this).balance == 7 ether` as a winning condition. Force ETH into it using a `selfdestruct` bomb contract to break the invariant and make the game unwinnable.',
    objectives: [
      'Understand why address(this).balance can be manipulated externally',
      'Write a Bomb contract that selfdestructs and force-sends ETH to EtherGame',
      'Show in a test that the 7-ether win condition is now unreachable',
    ],
    initialClusterState: {
      namespaces: ['default'],
      currentNamespace: 'default',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'forge-project',
              namespace: 'default',
              labels: { status: 'selfdestruct-lab', tool: 'forge' },
              annotations: { vulnerability: 'selfdestruct-force-eth' },
              creationTimestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
              uid: 'crucible-cm-008',
            },
            data: {
              'src/EtherGame.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\ncontract EtherGame {\n  uint public targetAmount = 7 ether;\n  address public winner;\n  function deposit() external payable {\n    // VULNERABLE: anyone can skip past 7 ETH via selfdestruct\n    require(address(this).balance <= targetAmount);\n    if (address(this).balance == targetAmount) winner = msg.sender;\n  }\n}',
            },
          },
        },
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'forge-exploit',
              namespace: 'default',
              labels: { tool: 'forge', status: 'selfdestruct-lab' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
              uid: 'crucible-pod-008',
            },
            spec: {
              containers: [{
                name: 'forge',
                image: 'ghcr.io/foundry-rs/foundry:latest',
                ports: [],
                env: [{ name: 'FORGE_STATUS', value: 'selfdestruct-lab' }],
                envFrom: [],
              }],
            },
            status: {
              phase: 'Running',
              containerStatuses: [{
                name: 'forge',
                ready: true,
                restartCount: 0,
                state: 'running',
                image: 'ghcr.io/foundry-rs/foundry:latest',
              }],
              message: 'Selfdestruct attack lab ready',
              reason: 'Pending',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'custom',
      targetName: 'invariant-broken',
      expectedValue: 'forge test --match-test testForceFeed',
    },
    hints: [
      { id: 'ch8-1', order: 1, text: 'Write a `Bomb` contract: `constructor(address target) payable { selfdestruct(payable(target)); }`. Deploying it force-sends ETH to target.', pointPenalty: 20 },
      { id: 'ch8-2', order: 2, text: 'In the test: seed the game with 6 ETH via normal deposits, then deploy `new Bomb{value: 2 ether}(address(game))`. Balance jumps to 8 ETH, past the 7 ETH target.', pointPenalty: 35 },
      { id: 'ch8-3', order: 3, text: 'After the bomb, call `game.deposit{value: 1 ether}()` — it will revert because balance > targetAmount. `winner` is never set. The invariant is broken.', pointPenalty: 50 },
    ],
    solutionCommands: [
      'forge test --match-test testForceFeed',
      'forge test --match-test testForceFeed -vvvv',
    ],
    teacherNotes: 'Teaches: selfdestruct force-ETH, why address(this).balance is unreliable, alternative: track ETH with a state variable.',
    conceptId: 'selfdestruct-attack',
  },

  {
    id: 'crucible-s09-access-control-bypass',
    slug: 'access-control-bypass',
    name: 'Ownable Misconfiguration',
    category: 'security',
    difficulty: 3,
    estimatedMinutes: 12,
    maxPoints: 200,
    description: "A contract's onlyOwner modifier has a logic bug. Find and exploit it.",
    story: '🔓 **BROKEN LOCK** — The `Vault` contract has an `onlyOwner` modifier, but it contains a logic flaw: the condition checks `msg.sender != owner` but inverts the require logic. Any address can call admin functions. Find it and demonstrate the bypass.',
    objectives: [
      'Read the onlyOwner modifier carefully and find the logic error',
      'Write a test showing an unauthorized address can call withdrawAll()',
      'Fix the modifier and confirm the exploit no longer works',
    ],
    initialClusterState: {
      namespaces: ['default'],
      currentNamespace: 'default',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'forge-project',
              namespace: 'default',
              labels: { status: 'access-control-bug', tool: 'forge' },
              annotations: { vulnerability: 'inverted-require' },
              creationTimestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
              uid: 'crucible-cm-009',
            },
            data: {
              'src/OwnerVault.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\ncontract OwnerVault {\n  address public owner;\n  constructor() { owner = msg.sender; }\n  // BUG: require condition is inverted — allows everyone EXCEPT owner!\n  modifier onlyOwner() {\n    require(msg.sender != owner, "not owner");\n    _;\n  }\n  function withdrawAll() external onlyOwner {\n    payable(msg.sender).transfer(address(this).balance);\n  }\n  receive() external payable {}\n}',
              'test/OwnerVault.t.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\nimport "forge-std/Test.sol";\nimport "../src/OwnerVault.sol";\ncontract OwnerVaultTest is Test {\n  // TODO: demonstrate that a random address can call withdrawAll()\n}',
            },
          },
        },
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'forge-exploit',
              namespace: 'default',
              labels: { tool: 'forge', status: 'access-control-bug' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
              uid: 'crucible-pod-009',
            },
            spec: {
              containers: [{
                name: 'forge',
                image: 'ghcr.io/foundry-rs/foundry:latest',
                ports: [],
                env: [{ name: 'FORGE_STATUS', value: 'access-control-bug' }],
                envFrom: [],
              }],
            },
            status: {
              phase: 'Running',
              containerStatuses: [{
                name: 'forge',
                ready: true,
                restartCount: 0,
                state: 'running',
                image: 'ghcr.io/foundry-rs/foundry:latest',
              }],
              message: 'Access control bug — find the modifier flaw',
              reason: 'Pending',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'custom',
      targetName: 'unauthorized-call-demonstrated',
      expectedValue: 'forge test --match-test testUnauthorizedWithdraw',
    },
    hints: [
      { id: 'ch9-1', order: 1, text: 'The `onlyOwner` modifier uses `require(msg.sender != owner)` — note the `!=`. This means the owner CANNOT call the function, but everyone else can!', pointPenalty: 20 },
      { id: 'ch9-2', order: 2, text: 'Write `testUnauthorizedWithdraw()`: use `vm.deal(address(vault), 10 ether)`, then `vm.prank(address(0xBEEF))` to impersonate a stranger and call `vault.withdrawAll()`.', pointPenalty: 35 },
      { id: 'ch9-3', order: 3, text: 'Assert `address(0xBEEF).balance == 10 ether` after the call. Fix the modifier by changing `!=` to `==` (i.e., `require(msg.sender == owner)`).', pointPenalty: 50 },
    ],
    solutionCommands: [
      'forge test --match-test testUnauthorizedWithdraw',
      'forge test --match-test testUnauthorizedWithdraw -vvvv',
    ],
    teacherNotes: 'Teaches: inverted access control, vm.prank cheatcode, OpenZeppelin Ownable as the correct solution. Very common real-world audit finding.',
    conceptId: 'access-control',
  },

  {
    id: 'crucible-s10-flash-loan-test',
    slug: 'flash-loan-test',
    name: 'Flash Loan Invariant Break',
    category: 'security',
    difficulty: 4,
    estimatedMinutes: 20,
    maxPoints: 300,
    description: 'Use a simulated flash loan in a Foundry test to break a DeFi invariant.',
    story: '⚡ **FLASH ATTACK** — A simple AMM uses spot price from its own reserves to calculate swap rates. Flash-borrow a huge amount, manipulate the price oracle, extract value, repay — all in one transaction. Forge simulates this without a real lender.',
    objectives: [
      'Understand the AMM price oracle vulnerability (spot price manipulation)',
      'Write a flash loan simulation using vm.deal and single-transaction mechanics',
      'Show the invariant k=x*y is broken mid-transaction via price manipulation',
    ],
    initialClusterState: {
      namespaces: ['default'],
      currentNamespace: 'default',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'forge-project',
              namespace: 'default',
              labels: { status: 'flash-loan-lab', tool: 'forge' },
              annotations: { vulnerability: 'price-oracle-manipulation' },
              creationTimestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
              uid: 'crucible-cm-010',
            },
            data: {
              'src/SimpleAMM.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\ncontract SimpleAMM {\n  uint public reserveA;\n  uint public reserveB;\n  constructor(uint a, uint b) { reserveA = a; reserveB = b; }\n  function getPrice() external view returns (uint) { return reserveB / reserveA; }\n  function swapAforB(uint amtA) external returns (uint amtB) {\n    amtB = (amtA * reserveB) / (reserveA + amtA);\n    reserveA += amtA;\n    reserveB -= amtB;\n  }\n}',
              'test/FlashLoan.t.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\nimport "forge-std/Test.sol";\nimport "../src/SimpleAMM.sol";\ncontract FlashLoanTest is Test {\n  // TODO: write testFlashLoan() — use vm.deal to simulate flash capital\n}',
            },
          },
        },
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'forge-flash',
              namespace: 'default',
              labels: { tool: 'forge', status: 'flash-loan-lab' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
              uid: 'crucible-pod-010',
            },
            spec: {
              containers: [{
                name: 'forge',
                image: 'ghcr.io/foundry-rs/foundry:latest',
                ports: [],
                env: [{ name: 'FORGE_STATUS', value: 'flash-loan-lab' }],
                envFrom: [],
              }],
            },
            status: {
              phase: 'Running',
              containerStatuses: [{
                name: 'forge',
                ready: true,
                restartCount: 0,
                state: 'running',
                image: 'ghcr.io/foundry-rs/foundry:latest',
              }],
              message: 'Flash loan lab ready',
              reason: 'Pending',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'custom',
      targetName: 'flash-invariant-broken',
      expectedValue: 'forge test --match-test testFlashLoan',
    },
    hints: [
      { id: 'ch10-1', order: 1, text: 'In Foundry tests, simulate flash loan capital with `vm.deal(address(this), 1000 ether)`. There is no real lender needed — the test contract has arbitrary ETH.', pointPenalty: 20 },
      { id: 'ch10-2', order: 2, text: 'Record k = reserveA * reserveB before the swap. After a large `swapAforB(500 ether)`, check k again. Price has moved significantly, enabling arbitrage.', pointPenalty: 35 },
      { id: 'ch10-3', order: 3, text: 'Assert that `amm.getPrice()` changes dramatically after your large swap, demonstrating spot price manipulation. Use `assertNotEq(priceBefore, priceAfter)`.', pointPenalty: 50 },
    ],
    solutionCommands: [
      'forge test --match-test testFlashLoan',
      'forge test --match-test testFlashLoan -vvvv',
    ],
    teacherNotes: 'Teaches: flash loan mechanics, price oracle manipulation, TWAP oracles as mitigation, k=x*y constant product formula.',
    conceptId: 'flash-loan-testing',
  },

  // ──────────────────────────────────────────────
  // EXPERT — Advanced Tooling (difficulty 4)
  // ──────────────────────────────────────────────
  {
    id: 'crucible-s11-coverage-report',
    slug: 'coverage-report',
    name: '100% Branch Coverage',
    category: 'symbolic',
    difficulty: 4,
    estimatedMinutes: 15,
    maxPoints: 250,
    description: 'A contract has uncovered branches. Achieve full coverage.',
    story: '🗺️ **COVERAGE GAP** — `forge coverage` shows the `Escrow` contract has only 60% branch coverage. Two branches — the timeout path and the dispute resolution — have no tests. Write tests for every branch until you hit 100%.',
    objectives: [
      'Run forge coverage to see which branches are uncovered',
      'Write tests for the timeout release path and dispute resolution path',
      'Run forge coverage --report lcov and confirm 100% branch coverage',
    ],
    initialClusterState: {
      namespaces: ['default'],
      currentNamespace: 'default',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'forge-project',
              namespace: 'default',
              labels: { status: 'coverage-gap', tool: 'forge' },
              annotations: { coverage: '60% branch' },
              creationTimestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              uid: 'crucible-cm-011',
            },
            data: {
              'src/Escrow.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\ncontract Escrow {\n  address public buyer;\n  address public seller;\n  uint public deadline;\n  bool public released;\n  bool public disputed;\n  constructor(address _seller, uint _deadline) payable {\n    buyer = msg.sender;\n    seller = _seller;\n    deadline = _deadline;\n  }\n  function release() external {\n    require(msg.sender == buyer);\n    require(!released);\n    released = true;\n    payable(seller).transfer(address(this).balance);\n  }\n  function timeoutRelease() external {\n    require(block.timestamp > deadline); // BRANCH: uncovered\n    require(!released);\n    released = true;\n    payable(buyer).transfer(address(this).balance);\n  }\n  function dispute() external {\n    require(msg.sender == buyer || msg.sender == seller);\n    disputed = true; // BRANCH: uncovered\n  }\n}',
              'test/Escrow.t.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\nimport "forge-std/Test.sol";\nimport "../src/Escrow.sol";\ncontract EscrowTest is Test {\n  function testRelease() public {\n    Escrow e = new Escrow{value: 1 ether}(address(0xBEEF), block.timestamp + 1 days);\n    e.release();\n    assertEq(address(0xBEEF).balance, 1 ether);\n  }\n  // TODO: testTimeoutRelease, testDispute\n}',
            },
          },
        },
        {
          kind: 'Deployment',
          spec: {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
              name: 'forge-ci',
              namespace: 'default',
              labels: { tool: 'forge', status: 'coverage-fail' },
              annotations: { 'branch-coverage': '60%' },
              creationTimestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              uid: 'crucible-deploy-002',
            },
            spec: {
              replicas: 0,
              selector: { matchLabels: { tool: 'forge' } },
              template: {
                metadata: { labels: { tool: 'forge' }, annotations: {} },
                spec: {
                  containers: [{
                    name: 'forge',
                    image: 'ghcr.io/foundry-rs/foundry:latest',
                    ports: [],
                    env: [{ name: 'CI_STATUS', value: 'coverage-60pct' }],
                    envFrom: [],
                  }],
                },
              },
            },
            status: {
              replicas: 0,
              readyReplicas: 0,
              availableReplicas: 0,
              unavailableReplicas: 0,
              conditions: [{ type: 'Available', status: 'False', message: 'Branch coverage below 100%' }],
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'custom',
      targetName: 'full-branch-coverage',
      expectedValue: 'forge coverage --report lcov',
    },
    hints: [
      { id: 'ch11-1', order: 1, text: 'Run `forge coverage` — look for lines marked with [x] meaning uncovered. The timeout and dispute branches will show up.', pointPenalty: 20 },
      { id: 'ch11-2', order: 2, text: 'Use `vm.warp(block.timestamp + 2 days)` in `testTimeoutRelease()` to fast-forward time past the deadline. Then call `e.timeoutRelease()`.', pointPenalty: 35 },
      { id: 'ch11-3', order: 3, text: 'For `testDispute()`: call `e.dispute()` as buyer, assert `e.disputed() == true`. Then run `forge coverage --report lcov` to confirm 100%.', pointPenalty: 50 },
    ],
    solutionCommands: [
      'forge coverage',
      'forge coverage --report lcov',
      'forge coverage --report summary',
    ],
    teacherNotes: 'Teaches: forge coverage, vm.warp for time manipulation, branch coverage vs line coverage, LCOV report generation.',
    conceptId: 'coverage',
  },

  {
    id: 'crucible-s12-symbolic-execution',
    slug: 'symbolic-execution',
    name: 'Halmos Symbolic Test',
    category: 'symbolic',
    difficulty: 4,
    estimatedMinutes: 20,
    maxPoints: 300,
    description: 'Use symbolic execution to prove a function can never overflow.',
    story: '🤖 **SYMBOLIC PROOF** — The `SafeAdd` library claims it can never overflow. Instead of fuzzing with random inputs, use Halmos symbolic execution to formally verify the property holds for ALL possible uint256 inputs simultaneously.',
    objectives: [
      'Write a check_ function (Halmos convention) asserting no overflow',
      'Run halmos --function check_noOverflow to launch symbolic execution',
      'Interpret the result: PASS means formally proved, FAIL shows a counterexample',
    ],
    initialClusterState: {
      namespaces: ['default'],
      currentNamespace: 'default',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'forge-project',
              namespace: 'default',
              labels: { status: 'symbolic-lab', tool: 'halmos' },
              annotations: { tool: 'halmos symbolic execution' },
              creationTimestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
              uid: 'crucible-cm-012',
            },
            data: {
              'src/SafeAdd.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\nlibrary SafeAdd {\n  // Claim: never overflows (Solidity 0.8+ reverts on overflow)\n  function add(uint256 a, uint256 b) internal pure returns (uint256) {\n    return a + b; // 0.8+ auto-checks overflow\n  }\n}',
              'test/SafeAdd.symbolic.t.sol': '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\nimport "forge-std/Test.sol";\nimport "../src/SafeAdd.sol";\ncontract SafeAddSymbolicTest is Test {\n  using SafeAdd for uint256;\n  // Halmos will treat a,b as symbolic variables covering ALL uint256 values\n  function check_noOverflow(uint256 a, uint256 b) external pure {\n    // TODO: assert the property you want to prove\n  }\n}',
            },
          },
        },
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'halmos-runner',
              namespace: 'default',
              labels: { tool: 'halmos', status: 'symbolic-lab' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
              uid: 'crucible-pod-012',
            },
            spec: {
              containers: [{
                name: 'halmos',
                image: 'ghcr.io/a16z/halmos:latest',
                ports: [],
                env: [{ name: 'HALMOS_STATUS', value: 'symbolic-lab' }],
                envFrom: [],
              }],
            },
            status: {
              phase: 'Running',
              containerStatuses: [{
                name: 'halmos',
                ready: true,
                restartCount: 0,
                state: 'running',
                image: 'ghcr.io/a16z/halmos:latest',
              }],
              message: 'Symbolic execution lab ready — write check_ function',
              reason: 'Pending',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'custom',
      targetName: 'property-proved',
      expectedValue: 'halmos --function check_noOverflow',
    },
    hints: [
      { id: 'ch12-1', order: 1, text: 'Halmos uses `check_` prefix (not `test_`). The parameters `(uint256 a, uint256 b)` become symbolic variables — Halmos explores ALL values simultaneously via SMT solving.', pointPenalty: 20 },
      { id: 'ch12-2', order: 2, text: 'Add the assertion: `uint256 result = a.add(b); assert(result >= a);` — if the addition overflows, result would wrap and be smaller than a. In Solidity 0.8+ this reverts, so Halmos proves it never happens.', pointPenalty: 35 },
      { id: 'ch12-3', order: 3, text: 'Run `halmos --function check_noOverflow`. Output should be `[PASS]`. Compare this with fuzzing: Halmos proves the property, fuzzing only samples inputs. Then try with an `unchecked` block to see it FAIL.', pointPenalty: 50 },
    ],
    solutionCommands: [
      'halmos --function check_noOverflow',
      'halmos --function check_noOverflow --solver-timeout 60000',
    ],
    teacherNotes: 'Expert topic: symbolic execution vs fuzzing. Halmos uses SMT solving (Z3) to exhaustively verify properties. Key for protocol invariant proofs.',
    conceptId: 'symbolic-exec',
  },
];

const crucibleCharacters: Character[] = [
  {
    id: 'operator',
    name: 'Zora the Auditor',
    title: 'Security Auditor',
    description: 'Security expert who specialises in finding vulnerabilities. Reduces hint costs and earns more on exploit scenarios.',
    avatarEmoji: '🔍',
    primaryColor: '#EF4444',
    flavor: '"Every contract has a bug. Your job is to find it first."',
    buff: {
      id: 'zora-buff',
      name: 'Exploit Specialist',
      description: '+30% on security scenarios, +20% on symbolic, hint cost -50%',
      categoryMultiplier: { security: 1.3, symbolic: 1.2 },
      hintCostReduction: 0.5,
      timeBonus: 0,
      streakProtection: false,
    },
  },
  {
    id: 'developer',
    name: 'Dev the Fuzzer',
    title: 'Fuzzing Specialist',
    description: 'Property-based testing expert. Earns bonus points on fuzz and invariant scenarios and gets extra time.',
    avatarEmoji: '🎲',
    primaryColor: '#8B5CF6',
    flavor: '"If you can\'t fuzz it, you don\'t understand it."',
    buff: {
      id: 'dev-buff',
      name: 'Property Hunter',
      description: '+30% on fuzzing scenarios, +15% on testing, +30s timer',
      categoryMultiplier: { fuzzing: 1.3, testing: 1.15 },
      hintCostReduction: 0,
      timeBonus: 30,
      streakProtection: false,
    },
  },
  {
    id: 'sre',
    name: 'Sage the Architect',
    title: 'Security Architect',
    description: 'Design patterns and access control expert. Earns more on configuration and RBAC challenges.',
    avatarEmoji: '🏗️',
    primaryColor: '#10B981',
    flavor: '"Secure by design beats secure by review."',
    buff: {
      id: 'sage-buff',
      name: 'Design Guard',
      description: '+20% on testing and symbolic scenarios',
      categoryMultiplier: { testing: 1.2, symbolic: 1.15 },
      hintCostReduction: 0.2,
      timeBonus: 0,
      streakProtection: false,
    },
  },
  {
    id: 'architect',
    name: 'Rex the Researcher',
    title: 'Security Researcher',
    description: 'Advanced tooling and formal methods expert. Streak protection and bonus on symbolic execution scenarios.',
    avatarEmoji: '🧪',
    primaryColor: '#F59E0B',
    flavor: '"Prove it. Don\'t just test it."',
    buff: {
      id: 'rex-buff',
      name: 'Formal Methods',
      description: '+30% on symbolic scenarios, +15% on security, streak protect',
      categoryMultiplier: { symbolic: 1.3, security: 1.15 },
      hintCostReduction: 0,
      timeBonus: 0,
      streakProtection: true,
    },
  },
];

export const crucibleCourse: Course = {
  id: 'crucible',
  name: 'Crucible: Smart Contract Security',
  icon: '🔥',
  description: 'Master smart contract security testing using Foundry and Halmos — from unit tests to symbolic execution and live exploit writing.',
  terminalPrompt: '🔥 forge $ ',
  terminalWelcome: [
    '\x1b[31m╔══════════════════════════════════════╗\x1b[0m',
    '\x1b[31m║   Crucible Security Lab              ║\x1b[0m',
    '\x1b[31m║   forge test --match-contract         ║\x1b[0m',
    '\x1b[31m║   ExploitLab                         ║\x1b[0m',
    '\x1b[31m╚══════════════════════════════════════╝\x1b[0m',
  ],
  scenarios: crucibleScenarios,
  characters: crucibleCharacters,
};
