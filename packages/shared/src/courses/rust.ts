import type { Course } from '../types/course';
import type { Character } from '../types/game';
import type { Scenario } from '../types/scenario';

const rustScenarios: Scenario[] = [
  {
    id: 'rust-s01-borrow-checker',
    slug: 'borrow-checker-strikes',
    name: 'Borrow Checker Strikes',
    category: 'rust-fundamentals',
    difficulty: 1,
    estimatedMinutes: 5,
    maxPoints: 100,
    description: 'Code won\'t compile — a variable is moved and then used.',
    story: '🦀 **BORROW CHECKER PANIC** — Your code won\'t compile. A variable has been moved into a function and then used again. The borrow checker is unforgiving. Add `.clone()` or restructure the code to make `cargo check` pass.',
    objectives: [
      'Run cargo check to see the borrow checker error',
      'Identify the moved variable that is used after the move',
      'Fix the error by cloning the value or restructuring ownership',
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
              name: 'cargo-project',
              namespace: 'default',
              labels: { status: 'compile-error' },
              annotations: { error: 'use of moved value: `data`' },
              creationTimestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
              uid: 'rust-cm-001',
            },
            data: {
              'src/main.rs': 'fn process(s: String) { println!("{}", s); }\nfn main() {\n  let data = String::from("hello");\n  process(data);\n  println!("{}", data); // ERROR: data moved\n}',
              'Cargo.toml': '[package]\nname = "borrow-demo"\nversion = "0.1.0"\nedition = "2021"',
            },
          },
        },
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'cargo-check',
              namespace: 'default',
              labels: { tool: 'cargo', status: 'error' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
              uid: 'rust-pod-001',
            },
            spec: {
              containers: [{
                name: 'rust',
                image: 'rust:latest',
                ports: [],
                env: [{ name: 'RUST_STATUS', value: 'compile-error' }],
                envFrom: [],
              }],
            },
            status: {
              phase: 'CrashLoopBackOff',
              containerStatuses: [{
                name: 'rust',
                ready: false,
                restartCount: 0,
                state: 'waiting',
                stateReason: 'CrashLoopBackOff',
                image: 'rust:latest',
              }],
              message: 'error[E0382]: use of moved value: `data`',
              reason: 'CompileError',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'env-var-set',
      targetNamespace: 'default',
      targetName: 'cargo-check',
      expectedValue: 'RUST_STATUS',
    },
    hints: [
      { id: 'rh1-1', order: 1, text: 'Run `cargo check` to see the full error. Look for "use of moved value".', pointPenalty: 20 },
      { id: 'rh1-2', order: 2, text: 'When a `String` is passed to a function, ownership moves. Use `.clone()` to keep the original: `process(data.clone())`.', pointPenalty: 35 },
      { id: 'rh1-3', order: 3, text: 'Change `process(data)` to `process(data.clone())` — this copies the string so `data` is still valid afterwards.', pointPenalty: 50 },
    ],
    solutionCommands: [
      'cargo check',
      'cargo fix',
    ],
    teacherNotes: 'Core ownership concept: move semantics with String. Contrast with Copy types like i32.',
  },

  {
    id: 'rust-s02-missing-lifetime',
    slug: 'dangling-reference',
    name: 'Dangling Reference',
    category: 'rust-fundamentals',
    difficulty: 2,
    estimatedMinutes: 8,
    maxPoints: 150,
    description: 'A function returns a reference to one of two inputs but the compiler cannot infer which — E0106 results.',
    story: '⏳ **LIFETIME ERROR** — The `longest` function takes two string slices and returns the longer one. Because either `x` or `y` could be returned, the compiler cannot infer the lifetime of the output reference. Add explicit lifetime annotations to resolve E0106.',
    objectives: [
      'Run cargo check to see the E0106 lifetime error',
      'Understand why returning one of two references requires an explicit lifetime',
      'Add the `\'a` lifetime annotation to the function signature',
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
              name: 'cargo-project',
              namespace: 'default',
              labels: { status: 'lifetime-error' },
              annotations: { error: 'E0106: missing lifetime specifier' },
              creationTimestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
              uid: 'rust-cm-002',
            },
            data: {
              'src/main.rs': '// E0106: missing lifetime specifier\nfn longest(x: &str, y: &str) -> &str {\n  if x.len() > y.len() { x } else { y }\n}\nfn main() {\n  let s1 = String::from("long string");\n  let result;\n  {\n    let s2 = String::from("xy");\n    result = longest(s1.as_str(), s2.as_str());\n  }\n  println!("Longest: {}", result);\n}',
              'Cargo.toml': '[package]\nname = "lifetime-demo"\nversion = "0.1.0"\nedition = "2021"',
            },
          },
        },
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'cargo-check',
              namespace: 'default',
              labels: { tool: 'cargo', status: 'error' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
              uid: 'rust-pod-002',
            },
            spec: {
              containers: [{
                name: 'rust',
                image: 'rust:latest',
                ports: [],
                env: [{ name: 'RUST_STATUS', value: 'lifetime-error' }],
                envFrom: [],
              }],
            },
            status: {
              phase: 'CrashLoopBackOff',
              containerStatuses: [{
                name: 'rust',
                ready: false,
                restartCount: 0,
                state: 'waiting',
                stateReason: 'CrashLoopBackOff',
                image: 'rust:latest',
              }],
              message: 'error[E0106]: missing lifetime specifier — cannot determine which input the return borrows from',
              reason: 'CompileError',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'label-set',
      targetNamespace: 'default',
      targetName: 'cargo-check',
      targetKind: 'Pod',
      expectedLabels: { status: 'ok' },
    },
    hints: [
      { id: 'rh2-1', order: 1, text: 'Run `cargo check`. The error is E0106 because the compiler sees two input references (`x` and `y`) and cannot determine which one the return value borrows from.', pointPenalty: 20 },
      { id: 'rh2-2', order: 2, text: 'Lifetime elision cannot help here — unlike a single-input function, `longest` has two references and the output could be either. You must annotate explicitly.', pointPenalty: 35 },
      { id: 'rh2-3', order: 3, text: 'Fix: `fn longest<\'a>(x: &\'a str, y: &\'a str) -> &\'a str`. The `\'a` says "the output lives at least as long as the shorter of the two inputs."', pointPenalty: 50 },
    ],
    solutionCommands: [
      'cargo check',
      'cargo build',
    ],
    teacherNotes: 'Teaches E0106 lifetime error in a genuinely ambiguous case. Contrast with first_word (single input, elision works). Discuss why the multi-input case requires explicit lifetimes.',
  },

  {
    id: 'rust-s03-dependency-conflict',
    slug: 'dependency-hell',
    name: 'Dependency Hell',
    category: 'rust-fundamentals',
    difficulty: 2,
    estimatedMinutes: 8,
    maxPoints: 150,
    description: '`cargo build` fails because of a version conflict in Cargo.toml.',
    story: '📦 **DEPENDENCY HELL** — `cargo build` fails because two crates require incompatible versions of the same dependency. Pin to a compatible version in `Cargo.toml` so `cargo build` succeeds.',
    objectives: [
      'Run cargo build to see the version conflict error',
      'Identify which dependency versions are incompatible',
      'Pin to a compatible version in Cargo.toml',
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
              name: 'cargo-project',
              namespace: 'default',
              labels: { status: 'version-conflict' },
              annotations: { error: 'conflict: serde version mismatch' },
              creationTimestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
              uid: 'rust-cm-003',
            },
            data: {
              'Cargo.toml': '[package]\nname = "dep-hell"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\nserde = "1.0"\nserde_json = "0.9"   # Requires serde ^0.9, conflicts with serde 1.0',
              'src/main.rs': 'fn main() { println!("Hello"); }',
            },
          },
        },
        {
          kind: 'Deployment',
          spec: {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
              name: 'cargo-build',
              namespace: 'default',
              labels: { tool: 'cargo', status: 'failed' },
              annotations: { error: 'version conflict: serde_json 0.9 requires serde ^0.9, but serde 1.0 is specified' },
              creationTimestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
              uid: 'rust-deploy-001',
            },
            spec: {
              replicas: 0,
              selector: { matchLabels: { tool: 'cargo' } },
              template: {
                metadata: { labels: { tool: 'cargo' }, annotations: {} },
                spec: {
                  containers: [{
                    name: 'rust',
                    image: 'rust:latest',
                    ports: [],
                    env: [{ name: 'CARGO_STATUS', value: 'conflict' }],
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
              conditions: [{ type: 'Available', status: 'False', message: 'Dependency version conflict' }],
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'replica-count',
      targetNamespace: 'default',
      targetName: 'cargo-build',
      expectedValue: 1,
    },
    hints: [
      { id: 'rh3-1', order: 1, text: 'Run `cargo build` and read the error carefully. It shows that `serde_json 0.9` requires `serde ^0.9` but the Cargo.toml specifies `serde = "1.0"` — a genuine conflict since serde 1.0 is not compatible with the ^0.9 requirement.', pointPenalty: 20 },
      { id: 'rh3-2', order: 2, text: 'The fix is to upgrade serde_json to a version that supports serde 1.x. Change `serde_json = "0.9"` to `serde_json = "1.0"` in Cargo.toml.', pointPenalty: 35 },
      { id: 'rh3-3', order: 3, text: 'Update Cargo.toml to use `serde_json = "1.0"` then run `cargo update` followed by `cargo build`. Both crates now share the same serde 1.x dependency.', pointPenalty: 50 },
    ],
    solutionCommands: [
      'cargo build',
      'cargo update',
      'cargo build --release',
    ],
    teacherNotes: 'Teaches SemVer, Cargo.lock, dependency resolution. Compare with npm/pip conflict strategies.',
  },

  {
    id: 'rust-s04-error-propagation',
    slug: 'error-propagation',
    name: 'Error Propagation',
    category: 'rust-fundamentals',
    difficulty: 2,
    estimatedMinutes: 8,
    maxPoints: 150,
    description: 'A function returns String but calls functions that return Result<T, E>. Fix it using the ? operator.',
    story: '❓ **UNWRAP PANIC** — The codebase uses `.unwrap()` everywhere. Clippy is angry, and a production crash happened when a file was missing. Replace `.unwrap()` with proper error propagation using the `?` operator.',
    objectives: [
      'Run `cargo clippy` to see the unwrap warnings',
      'Change the return type to Result<String, Box<dyn std::error::Error>>',
      'Replace .unwrap() calls with ? to propagate errors up the call stack',
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
              name: 'cargo-project',
              namespace: 'default',
              labels: { status: 'clippy-fail' },
              annotations: { error: 'clippy: unwrap used, panics on error' },
              creationTimestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
              uid: 'rust-cm-004',
            },
            data: {
              'src/main.rs': 'use std::fs;\nuse std::num::ParseIntError;\n\n// PROBLEM: panics if file missing or content not a number\nfn read_number(path: &str) -> String {\n  let content = fs::read_to_string(path).unwrap();\n  let n: i32 = content.trim().parse().unwrap();\n  format!("The number is {}", n)\n}\n\nfn main() {\n  println!("{}", read_number("number.txt"));\n}',
              'Cargo.toml': '[package]\nname = "error-prop"\nversion = "0.1.0"\nedition = "2021"',
            },
          },
        },
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'cargo-clippy',
              namespace: 'default',
              labels: { tool: 'cargo', status: 'clippy-fail' },
              annotations: { clippy_clean: 'false' },
              creationTimestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
              uid: 'rust-pod-004',
            },
            spec: {
              containers: [{
                name: 'rust',
                image: 'rust:latest',
                ports: [],
                env: [{ name: 'RUST_STATUS', value: 'clippy-fail' }],
                envFrom: [],
              }],
            },
            status: {
              phase: 'CrashLoopBackOff',
              containerStatuses: [{
                name: 'rust',
                ready: false,
                restartCount: 1,
                state: 'waiting',
                stateReason: 'CrashLoopBackOff',
                image: 'rust:latest',
              }],
              message: 'warning: used `unwrap()` on a `Result` — panicked in production',
              reason: 'ClippyError',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'annotation-set',
      targetNamespace: 'default',
      targetName: 'cargo-clippy',
      targetKind: 'Pod',
      expectedLabels: { clippy_clean: 'true' },
      label: 'clippy passes after replacing unwrap() with ?',
    },
    hints: [
      { id: 'rh4-1', order: 1, text: 'Run `cargo clippy` — it flags `.unwrap()` as a potential panic. The fix is to use `?` which propagates the error instead of panicking.', pointPenalty: 20 },
      { id: 'rh4-2', order: 2, text: 'Change the return type to `Result<String, Box<dyn std::error::Error>>`. The `Box<dyn Error>` can hold any error type, allowing `?` to work on both `io::Error` and `ParseIntError`.', pointPenalty: 35 },
      { id: 'rh4-3', order: 3, text: 'Replace `.unwrap()` with `?` on each call. The `?` operator returns `Err(e)` early from the function. In `main`, use `-> Result<(), Box<dyn Error>>` and propagate with `?`.', pointPenalty: 50 },
    ],
    solutionCommands: [
      'cargo clippy',
      'cargo build',
    ],
    teacherNotes: 'Teaches: ? operator, From trait for error conversion, Box<dyn Error> as a catch-all. Compare with panic vs recoverable errors.',
  },

  {
    id: 'rust-s05-mutex-deadlock',
    slug: 'shared-state-deadlock',
    name: 'Shared State Deadlock',
    category: 'rust-fundamentals',
    difficulty: 3,
    estimatedMinutes: 12,
    maxPoints: 200,
    description: 'Two threads lock Mutex<A> then Mutex<B> in opposite order — classic deadlock. Fix it.',
    story: '🔒 **DEADLOCK DETECTED** — Two worker threads each lock `mutex_a` first, then `mutex_b` — but in opposite order. Thread 1 holds A and waits for B; Thread 2 holds B and waits for A. The program hangs forever. Fix the lock ordering.',
    objectives: [
      'Understand why opposite lock ordering causes a deadlock',
      'Fix by enforcing consistent lock ordering across both threads',
      'Alternatively, use try_lock to detect and break the deadlock',
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
              name: 'cargo-project',
              namespace: 'default',
              labels: { status: 'deadlock' },
              annotations: { error: 'program hangs — deadlock on mutex acquisition' },
              creationTimestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              uid: 'rust-cm-005',
            },
            data: {
              'src/main.rs': 'use std::sync::{Arc, Mutex};\nuse std::thread;\n\nfn main() {\n  let mutex_a = Arc::new(Mutex::new(0i32));\n  let mutex_b = Arc::new(Mutex::new(0i32));\n\n  let (a1, b1) = (Arc::clone(&mutex_a), Arc::clone(&mutex_b));\n  let t1 = thread::spawn(move || {\n    let _a = a1.lock().unwrap(); // Thread 1: locks A first\n    thread::sleep(std::time::Duration::from_millis(10));\n    let _b = b1.lock().unwrap(); // Thread 1: then locks B — DEADLOCK if T2 holds B\n    println!("T1 done");\n  });\n\n  let (a2, b2) = (Arc::clone(&mutex_a), Arc::clone(&mutex_b));\n  let t2 = thread::spawn(move || {\n    let _b = b2.lock().unwrap(); // Thread 2: locks B first — opposite order!\n    let _a = a2.lock().unwrap(); // Thread 2: waits for A — DEADLOCK\n    println!("T2 done");\n  });\n\n  t1.join().unwrap();\n  t2.join().unwrap();\n}',
              'Cargo.toml': '[package]\nname = "deadlock-demo"\nversion = "0.1.0"\nedition = "2021"',
            },
          },
        },
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'cargo-run',
              namespace: 'default',
              labels: { tool: 'cargo', status: 'deadlock' },
              annotations: { deadlock_fixed: 'false' },
              creationTimestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              uid: 'rust-pod-005',
            },
            spec: {
              containers: [{
                name: 'rust',
                image: 'rust:latest',
                ports: [],
                env: [{ name: 'RUST_STATUS', value: 'deadlock' }],
                envFrom: [],
              }],
            },
            status: {
              phase: 'Running',
              containerStatuses: [{
                name: 'rust',
                ready: false,
                restartCount: 0,
                state: 'running',
                image: 'rust:latest',
              }],
              message: 'Program hanging — deadlock on mutex acquisition',
              reason: 'Deadlock',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'annotation-set',
      targetNamespace: 'default',
      targetName: 'cargo-run',
      targetKind: 'Pod',
      expectedLabels: { deadlock_fixed: 'true' },
      label: 'Deadlock resolved via consistent lock ordering',
    },
    hints: [
      { id: 'rh5-1', order: 1, text: 'The deadlock occurs because Thread 1 acquires A then B, while Thread 2 acquires B then A. Each holds a lock the other needs. This is the classic "dining philosophers" deadlock.', pointPenalty: 20 },
      { id: 'rh5-2', order: 2, text: 'Fix: enforce the same lock order in both threads — always lock A before B. In Thread 2, change the order to: `let _a = a2.lock().unwrap(); let _b = b2.lock().unwrap();`', pointPenalty: 35 },
      { id: 'rh5-3', order: 3, text: 'Alternative: use `try_lock()` which returns Err immediately if the mutex is already locked, then retry or back off. This avoids blocking indefinitely.', pointPenalty: 50 },
    ],
    solutionCommands: [
      'cargo build',
      'cargo run',
    ],
    teacherNotes: 'Teaches: deadlock conditions (hold-and-wait, circular wait), consistent lock ordering as prevention, try_lock as detection. Compare Rust Arc<Mutex> with other languages.',
  },

  {
    id: 'rust-s06-async-timeout',
    slug: 'async-tokio-timeout',
    name: 'Async Tokio Timeout',
    category: 'rust-fundamentals',
    difficulty: 3,
    estimatedMinutes: 12,
    maxPoints: 200,
    description: 'An async function awaits forever because there\'s no timeout. Add tokio::time::timeout.',
    story: '⏰ **ASYNC HANG** — A network fetch function awaits an HTTP response that never arrives. Without a timeout, the task hangs indefinitely. Wrap the async call with `tokio::time::timeout` to fail fast after 5 seconds.',
    objectives: [
      'Identify the async function that hangs without a timeout',
      'Add tokio::time::timeout wrapping the awaited future',
      'Handle the timeout error and return a meaningful message',
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
              name: 'cargo-project',
              namespace: 'default',
              labels: { status: 'async-hang' },
              annotations: { error: 'async task hangs — no timeout set' },
              creationTimestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
              uid: 'rust-cm-006',
            },
            data: {
              'src/main.rs': 'use tokio::time::Duration;\n\nasync fn fetch_data() -> String {\n  // Simulates a hung network call — never resolves\n  tokio::time::sleep(Duration::from_secs(3600)).await;\n  "data".to_string()\n}\n\n#[tokio::main]\nasync fn main() {\n  // BUG: no timeout — hangs forever\n  let result = fetch_data().await;\n  println!("Got: {}", result);\n}',
              'Cargo.toml': '[package]\nname = "async-timeout"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\ntokio = { version = "1", features = ["full"] }',
            },
          },
        },
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'cargo-async',
              namespace: 'default',
              labels: { tool: 'cargo', status: 'async-hang' },
              annotations: { async_fixed: 'false' },
              creationTimestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
              uid: 'rust-pod-006',
            },
            spec: {
              containers: [{
                name: 'rust',
                image: 'rust:latest',
                ports: [],
                env: [{ name: 'RUST_STATUS', value: 'async-hang' }],
                envFrom: [],
              }],
            },
            status: {
              phase: 'Running',
              containerStatuses: [{
                name: 'rust',
                ready: false,
                restartCount: 0,
                state: 'running',
                image: 'rust:latest',
              }],
              message: 'Async task hanging — no timeout configured',
              reason: 'AsyncHang',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'annotation-set',
      targetNamespace: 'default',
      targetName: 'cargo-async',
      targetKind: 'Pod',
      expectedLabels: { async_fixed: 'true' },
      label: 'Async timeout added — task fails fast instead of hanging',
    },
    hints: [
      { id: 'rh6-1', order: 1, text: 'Import: `use tokio::time::{timeout, Duration};`. The `timeout` function wraps any future and returns `Err(Elapsed)` if it doesn\'t complete in time.', pointPenalty: 20 },
      { id: 'rh6-2', order: 2, text: 'Wrap the call: `let result = timeout(Duration::from_secs(5), fetch_data()).await;`. This returns `Result<String, tokio::time::error::Elapsed>`.', pointPenalty: 35 },
      { id: 'rh6-3', order: 3, text: 'Handle both cases: `match result { Ok(data) => println!("Got: {}", data), Err(_) => println!("Request timed out after 5s") }`. Run `cargo run` to verify it exits after 5s.', pointPenalty: 50 },
    ],
    solutionCommands: [
      'cargo build',
      'cargo run',
    ],
    teacherNotes: 'Teaches: tokio::time::timeout, async/await patterns, graceful timeout handling. Discuss why all network calls need timeouts in production.',
  },
];

const rustCharacters: Character[] = [
  {
    id: 'operator',
    name: 'Felix the Systems Programmer',
    title: 'Systems Programmer',
    description: 'Low-level expert. Gets extra time and reduced hint costs on all challenges.',
    avatarEmoji: '🦀',
    primaryColor: '#3B82F6',
    flavor: '"The borrow checker is your friend. Eventually."',
    buff: {
      id: 'operator-buff',
      name: 'Memory Safety Expert',
      description: '+30s timer, 50% hint cost reduction',
      categoryMultiplier: { 'rust-fundamentals': 1.2 },
      hintCostReduction: 0.5,
      timeBonus: 30,
      streakProtection: false,
    },
  },
  {
    id: 'developer',
    name: 'Mia the Compiler Whisperer',
    title: 'Compiler Engineer',
    description: 'Knows the compiler inside out. Earns 20% more on config and debugging challenges.',
    avatarEmoji: '🔧',
    primaryColor: '#10B981',
    flavor: '"Read the error messages. All of them."',
    buff: {
      id: 'developer-buff',
      name: 'Compiler Insight',
      description: '+20% points on config/debugging, streak protection',
      categoryMultiplier: { 'rust-fundamentals': 1.2, debugging: 1.1 },
      hintCostReduction: 0,
      timeBonus: 0,
      streakProtection: true,
    },
  },
  {
    id: 'sre',
    name: 'Dev the Memory Safety SRE',
    title: 'Reliability Engineer',
    description: 'Tracks down unsafe patterns. Earns 25% more on debugging scenarios.',
    avatarEmoji: '🔍',
    primaryColor: '#F59E0B',
    flavor: '"No segfaults in production. Ever."',
    buff: {
      id: 'sre-buff',
      name: 'Zero-Cost Abstraction',
      description: '+25% on debugging/observability, hint cost reduction',
      categoryMultiplier: { 'rust-fundamentals': 1.25, debugging: 1.1 },
      hintCostReduction: 0.25,
      timeBonus: 0,
      streakProtection: false,
    },
  },
  {
    id: 'architect',
    name: 'Lex the API Architect',
    title: 'API Architect',
    description: 'Designs safe, ergonomic APIs. Earns 30% more on networking and RBAC scenarios.',
    avatarEmoji: '🏗️',
    primaryColor: '#8B5CF6',
    flavor: '"Make the wrong code impossible to write."',
    buff: {
      id: 'architect-buff',
      name: 'API Surface Master',
      description: '+30% on rbac/networking, +15s timer',
      categoryMultiplier: { 'rust-fundamentals': 1.3, networking: 1.1 },
      hintCostReduction: 0,
      timeBonus: 15,
      streakProtection: false,
    },
  },
];

export const rustCourse: Course = {
  id: 'rust',
  name: 'Rust Programming',
  icon: '🦀',
  description: 'Learn Rust ownership, borrowing, and cargo tooling by fixing real compile errors and dependency issues.',
  terminalPrompt: '🦀 $ ',
  terminalWelcome: [
    '\x1b[33m╔══════════════════════════════════════╗\x1b[0m',
    '\x1b[33m║   Rust Course Terminal               ║\x1b[0m',
    '\x1b[33m║   Type cargo commands to solve        ║\x1b[0m',
    '\x1b[33m╚══════════════════════════════════════╝\x1b[0m',
  ],
  scenarios: rustScenarios,
  characters: rustCharacters,
};
