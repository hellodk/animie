import type { Course } from '../types/course';
import type { Character } from '../types/game';
import type { Scenario } from '../types/scenario';

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

const blockchainScenarios: Scenario[] = [

  // -------------------------------------------------------------------------
  // Fundamentals — difficulty 1
  // -------------------------------------------------------------------------

  {
    id: 'bc-s01-block-anatomy',
    slug: 'block-anatomy',
    name: 'Dissect a Block',
    category: 'blockchain-fundamentals',
    difficulty: 1,
    estimatedMinutes: 5,
    maxPoints: 100,
    description: 'Inspect a block\'s hash, previous hash, nonce, and transactions to understand how a blockchain is structured.',
    story: '⛓️ **BLOCK BASICS** — The genesis block and block #1 have just been produced. Before you can audit this chain you need to understand its anatomy. Inspect both blocks and verify their fields.',
    objectives: [
      'Inspect the genesis block (block 0) and note its prevHash, hash, nonce, and transactions',
      'Inspect block 1 and confirm its prevHash matches block 0\'s hash',
      'Understand how the hash chain links blocks together',
    ],
    initialClusterState: {
      namespaces: ['blockchain'],
      currentNamespace: 'blockchain',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'block-0',
              namespace: 'blockchain',
              labels: { chain: 'mainnet', index: '0', type: 'genesis' },
              annotations: { inspected: 'false' },
              creationTimestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
              uid: 'bc-cm-block-0',
            },
            data: {
              index: '0',
              prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
              hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
              nonce: '83291',
              transactions: '[]',
              timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            },
          },
        },
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'block-1',
              namespace: 'blockchain',
              labels: { chain: 'mainnet', index: '1' },
              annotations: { inspected: 'false' },
              creationTimestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
              uid: 'bc-cm-block-1',
            },
            data: {
              index: '1',
              prevHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
              hash: 'f9e8d7c6b5a4f9e8d7c6b5a4f9e8d7c6b5a4f9e8d7c6b5a4f9e8d7c6b5a4f9e8',
              nonce: '142057',
              transactions: '[{"from":"Alice","to":"Bob","amount":1.5}]',
              timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'annotation-set',
      targetNamespace: 'blockchain',
      targetName: 'block-1',
      targetKind: 'ConfigMap',
      expectedLabels: { inspected: 'true' },
      label: 'Both genesis block and block 1 inspected',
    },
    hints: [
      {
        id: 'bc-h1-1', order: 1,
        text: 'Run `chain inspect block 0` to see the genesis block fields. Look at prevHash — all zeros means it is the first block.',
        pointPenalty: 20,
      },
      {
        id: 'bc-h1-2', order: 2,
        text: 'Run `chain inspect block 1` and compare its prevHash to block 0\'s hash. They should match exactly.',
        pointPenalty: 35,
      },
      {
        id: 'bc-h1-3', order: 3,
        text: 'The nonce is the number miners iterated to find a hash below the difficulty target. Each block\'s hash is a SHA-256 of its content + nonce. Run `chain annotate block 1 inspected=true` to confirm your findings.',
        pointPenalty: 50,
      },
    ],
    solutionCommands: [
      'chain inspect block 0',
      'chain inspect block 1',
      'chain annotate block 1 inspected=true',
    ],
    teacherNotes: 'Teaches: block structure (index, prevHash, hash, nonce, transactions, timestamp). Reinforce that changing any field invalidates the hash.',
    conceptId: 'block-anatomy',
  },

  {
    id: 'bc-s02-hash-chain',
    slug: 'break-the-chain',
    name: 'Break the Chain',
    category: 'blockchain-fundamentals',
    difficulty: 1,
    estimatedMinutes: 6,
    maxPoints: 100,
    description: 'A block\'s data was tampered. Identify which block is now invalid and explain why.',
    story: '🔴 **CHAIN INTEGRITY ALERT** — An automated monitor flagged an inconsistency. One of the blocks in the local chain has been tampered with. Run `chain verify` to find which block is invalid.',
    objectives: [
      'Run chain verify to scan all blocks for hash mismatches',
      'Identify the index of the tampered block',
      'Understand how tampering one block invalidates all subsequent blocks',
    ],
    initialClusterState: {
      namespaces: ['blockchain'],
      currentNamespace: 'blockchain',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'chain-state',
              namespace: 'blockchain',
              labels: { status: 'tampered', invalid_block: '2' },
              annotations: { verified: 'false' },
              creationTimestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              uid: 'bc-cm-chain-state',
            },
            data: {
              totalBlocks: '4',
              tampered_block_index: '2',
              error: 'block[2].hash does not match SHA256(block[2].data + nonce)',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'annotation-set',
      targetNamespace: 'blockchain',
      targetName: 'chain-state',
      targetKind: 'ConfigMap',
      expectedLabels: { verified: 'true' },
      label: 'Invalid block identified via chain verify',
    },
    hints: [
      {
        id: 'bc-h2-1', order: 1,
        text: 'Run `chain verify` — it re-computes each block\'s hash and checks it against prevHash of the next block.',
        pointPenalty: 20,
      },
      {
        id: 'bc-h2-2', order: 2,
        text: 'Look for the first block where `computed_hash != stored_hash`. That is the tampered block.',
        pointPenalty: 35,
      },
      {
        id: 'bc-h2-3', order: 3,
        text: 'Block 2 was tampered. Once block 2\'s hash changes, block 3\'s prevHash no longer matches — the chain is broken from block 2 onward. Run `chain annotate blockchain verified=true` to confirm your findings.',
        pointPenalty: 50,
      },
    ],
    solutionCommands: ['chain verify', 'chain annotate blockchain verified=true'],
    teacherNotes: 'Teaches: cryptographic integrity, why blockchains are tamper-evident. Ask students: what would an attacker need to do to cover their tracks?',
    conceptId: 'hash-chain',
  },

  {
    id: 'bc-s03-wallet-keygen',
    slug: 'create-a-wallet',
    name: 'Create a Wallet',
    category: 'wallets',
    difficulty: 1,
    estimatedMinutes: 5,
    maxPoints: 100,
    description: 'Generate a public/private keypair and derive a blockchain address from the public key.',
    story: '🔑 **NEW IDENTITY** — To interact with the blockchain you need a wallet. Generate a keypair, then derive your on-chain address. Guard the private key — whoever holds it controls the funds.',
    objectives: [
      'Run wallet generate to create a new private/public keypair',
      'Run wallet address to derive the on-chain address from the public key',
      'Run wallet balance to confirm the wallet is initialised with 0 ETH',
    ],
    initialClusterState: {
      namespaces: ['blockchain'],
      currentNamespace: 'blockchain',
      resources: [
        {
          kind: 'Secret',
          spec: {
            apiVersion: 'v1',
            kind: 'Secret',
            type: 'Opaque',
            metadata: {
              name: 'wallet-store',
              namespace: 'blockchain',
              labels: { ready: 'false' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
              uid: 'bc-secret-wallet',
            },
            data: {
              privateKey: '',
              publicKey: '',
              address: '',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'label-set',
      targetNamespace: 'blockchain',
      targetName: 'wallet-store',
      targetKind: 'Secret',
      expectedLabels: { ready: 'true' },
      label: 'Wallet generated and address derived',
    },
    hints: [
      {
        id: 'bc-h3-1', order: 1,
        text: 'Run `wallet generate` — this creates a 256-bit random private key and derives the public key via secp256k1 elliptic curve multiplication.',
        pointPenalty: 20,
      },
      {
        id: 'bc-h3-2', order: 2,
        text: 'Run `wallet address` — the address is the last 20 bytes of Keccak-256(public key), prefixed with 0x.',
        pointPenalty: 35,
      },
      {
        id: 'bc-h3-3', order: 3,
        text: 'Run `wallet balance` to confirm 0 ETH. Your wallet is ready. Never share the private key — it is the only proof of ownership.',
        pointPenalty: 50,
      },
    ],
    solutionCommands: ['wallet generate', 'wallet address', 'wallet balance'],
    teacherNotes: 'Teaches: asymmetric cryptography, secp256k1, Keccak-256 address derivation. Contrast private key (secret) vs address (public identifier).',
    conceptId: 'wallet-keys',
  },

  // -------------------------------------------------------------------------
  // Ethereum / EVM — difficulty 2
  // -------------------------------------------------------------------------

  {
    id: 'bc-s04-erc20-deploy',
    slug: 'deploy-erc20-token',
    name: 'Deploy an ERC-20 Token',
    category: 'tokens',
    difficulty: 2,
    estimatedMinutes: 8,
    maxPoints: 150,
    description: 'Compile and deploy a basic ERC-20 token contract to the local EVM node.',
    story: '🪙 **LAUNCH YOUR TOKEN** — The team is ready to launch $QUEST token. Compile Token.sol, deploy it to the local EVM, then call totalSupply() to verify the supply was minted correctly.',
    objectives: [
      'Compile Token.sol with eth compile',
      'Deploy the contract with eth deploy Token',
      'Call Token.totalSupply() to verify the initial supply is 1,000,000 tokens',
    ],
    initialClusterState: {
      namespaces: ['blockchain'],
      currentNamespace: 'blockchain',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'token-sol',
              namespace: 'blockchain',
              labels: { type: 'solidity-source', compiled: 'false', deployed: 'false' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
              uid: 'bc-cm-token-sol',
            },
            data: {
              filename: 'Token.sol',
              source: 'pragma solidity ^0.8.0;\ncontract Token {\n  string public name = "Quest";\n  string public symbol = "QUEST";\n  uint256 public totalSupply = 1_000_000e18;\n  mapping(address => uint256) public balanceOf;\n  constructor() { balanceOf[msg.sender] = totalSupply; }\n}',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'label-set',
      targetNamespace: 'blockchain',
      targetName: 'token-sol',
      targetKind: 'ConfigMap',
      expectedLabels: { compiled: 'true', deployed: 'true' },
      label: 'ERC-20 contract compiled and deployed, totalSupply verified',
    },
    hints: [
      {
        id: 'bc-h4-1', order: 1,
        text: 'Run `eth compile Token.sol` — this runs the Solidity compiler (solc) and outputs the ABI and bytecode.',
        pointPenalty: 20,
      },
      {
        id: 'bc-h4-2', order: 2,
        text: 'Run `eth deploy Token` — this sends a contract creation transaction to the EVM. Note the contract address in the output.',
        pointPenalty: 35,
      },
      {
        id: 'bc-h4-3', order: 3,
        text: 'Run `eth call Token.totalSupply()` — the return value should be 1000000000000000000000000 (1 million tokens × 10^18 decimals).',
        pointPenalty: 50,
      },
    ],
    solutionCommands: ['eth compile Token.sol', 'eth deploy Token', 'eth call Token.totalSupply()'],
    teacherNotes: 'Teaches: Solidity compilation, contract deployment transaction, ABI encoding. Discuss decimals and why ERC-20 uses uint256.',
    conceptId: 'erc20-token',
  },

  {
    id: 'bc-s05-erc20-transfer',
    slug: 'token-transfer-fails',
    name: 'Token Transfer Fails',
    category: 'tokens',
    difficulty: 2,
    estimatedMinutes: 8,
    maxPoints: 150,
    description: 'A transferFrom() call fails because the spender was never approved. Fix it.',
    story: '🚫 **TRANSFER REJECTED** — A DEX contract tried to pull tokens on behalf of a user and got reverted with "ERC20: insufficient allowance". The approve() step was skipped. Fix the flow.',
    objectives: [
      'Call Token.approve(spender, amount) to grant allowance',
      'Call Token.transferFrom(owner, recipient, amount) to execute the transfer',
      'Verify the recipient\'s balance increased',
    ],
    initialClusterState: {
      namespaces: ['blockchain'],
      currentNamespace: 'blockchain',
      resources: [
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'dex-contract',
              namespace: 'blockchain',
              labels: { app: 'dex', status: 'transfer-failed' },
              annotations: { error: 'ERC20: insufficient allowance', transfer_status: 'pending' },
              creationTimestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
              uid: 'bc-pod-dex',
            },
            spec: {
              containers: [{
                name: 'dex',
                image: 'evm:local',
                ports: [{ containerPort: 8545 }],
                env: [{ name: 'TRANSFER_STATUS', value: 'failed' }],
                envFrom: [],
              }],
            },
            status: {
              phase: 'CrashLoopBackOff',
              containerStatuses: [{
                name: 'dex',
                ready: false,
                restartCount: 1,
                state: 'waiting',
                stateReason: 'CrashLoopBackOff',
                image: 'evm:local',
              }],
              message: 'Revert: ERC20: insufficient allowance',
              reason: 'CrashLoopBackOff',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'annotation-set',
      targetNamespace: 'blockchain',
      targetName: 'dex-contract',
      targetKind: 'Pod',
      expectedLabels: { transfer_status: 'success' },
      label: 'transferFrom succeeds after approve() is called',
    },
    hints: [
      {
        id: 'bc-h5-1', order: 1,
        text: 'The ERC-20 allowance mechanism: owner calls approve(spender, amount) to permit the spender to move tokens on their behalf.',
        pointPenalty: 20,
      },
      {
        id: 'bc-h5-2', order: 2,
        text: 'Run `eth call Token.approve 0xDEX 500` — this sets allowance[owner][DEX] = 500 tokens.',
        pointPenalty: 35,
      },
      {
        id: 'bc-h5-3', order: 3,
        text: 'Now run `eth call Token.transferFrom 0xOwner 0xRecipient 500` — the DEX contract pulls the tokens within its allowance. Finally, run `kubectl annotate pod dex-contract transfer_status=success` to confirm the transfer succeeded.',
        pointPenalty: 50,
      },
    ],
    solutionCommands: ['eth call Token.approve 0xDEX 500', 'eth call Token.transferFrom 0xOwner 0xRecipient 500', 'kubectl annotate pod dex-contract transfer_status=success'],
    teacherNotes: 'Teaches: ERC-20 approve/allowance/transferFrom pattern. Real-world: DEXes, lending protocols all rely on this. Discuss infinite approvals risk.',
    conceptId: 'erc20-allowance',
  },

  {
    id: 'bc-s06-erc721-mint',
    slug: 'mint-an-nft',
    name: 'Mint an NFT',
    category: 'tokens',
    difficulty: 2,
    estimatedMinutes: 8,
    maxPoints: 150,
    description: 'Mint an ERC-721 token and verify ownership using ownerOf().',
    story: '🖼️ **NFT DROP** — The ArtQuest collection is live. Mint token ID #1 to your wallet and then confirm ownership with ownerOf(1). The contract is already deployed.',
    objectives: [
      'Call NFT.mint() to mint token ID 1 to your address',
      'Call NFT.ownerOf(1) to verify the token is now owned by your wallet',
      'Confirm that ownerOf returns your address, not the zero address',
    ],
    initialClusterState: {
      namespaces: ['blockchain'],
      currentNamespace: 'blockchain',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'nft-contract',
              namespace: 'blockchain',
              labels: { type: 'erc721', token_id_1_owner: 'unset' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
              uid: 'bc-cm-nft',
            },
            data: {
              name: 'ArtQuest',
              symbol: 'ART',
              totalMinted: '0',
              ownerOf_1: '0x0000000000000000000000000000000000000000',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'label-set',
      targetNamespace: 'blockchain',
      targetName: 'nft-contract',
      targetKind: 'ConfigMap',
      expectedLabels: { token_id_1_owner: 'wallet' },
      label: 'NFT token ID 1 minted and ownerOf verified',
    },
    hints: [
      {
        id: 'bc-h6-1', order: 1,
        text: 'Run `eth call NFT.mint` — the ERC-721 mint function assigns a new token ID and maps it to msg.sender in the _owners mapping.',
        pointPenalty: 20,
      },
      {
        id: 'bc-h6-2', order: 2,
        text: 'Run `eth call NFT.ownerOf(1)` — this looks up the _owners mapping for token ID 1 and returns the owner\'s address.',
        pointPenalty: 35,
      },
      {
        id: 'bc-h6-3', order: 3,
        text: 'The return value should be your wallet address (not the zero address). Non-fungible = each token ID has exactly one owner.',
        pointPenalty: 50,
      },
    ],
    solutionCommands: ['eth call NFT.mint', 'eth call NFT.ownerOf(1)'],
    teacherNotes: 'Teaches: ERC-721 vs ERC-20 (fungible vs non-fungible), _owners mapping, tokenId concept. Contrast with ERC-1155.',
    conceptId: 'erc721-nft',
  },

  {
    id: 'bc-s07-gas-estimation',
    slug: 'out-of-gas',
    name: 'Out of Gas',
    category: 'ethereum',
    difficulty: 2,
    estimatedMinutes: 8,
    maxPoints: 150,
    description: 'An ERC-20 batch transfer transaction fails out-of-gas. Estimate the correct gas limit and resubmit.',
    story: '⛽ **OUT OF GAS** — You set gas limit to 21,000 for an ERC-20 batch transfer — it failed. The simple ETH transfer limit of 21,000 is far too low for a Solidity batch operation. Estimate the real cost and resubmit with enough gas.',
    objectives: [
      'Run eth estimate to compute the gas needed for the batch transfer',
      'Resubmit the transaction with --gas set to at least 10% above the estimate',
      'Confirm the transaction is included in the next block',
    ],
    initialClusterState: {
      namespaces: ['blockchain'],
      currentNamespace: 'blockchain',
      resources: [
        {
          kind: 'Pod',
          spec: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'tx-relay',
              namespace: 'blockchain',
              labels: { app: 'tx-relay', tx_status: 'out-of-gas' },
              annotations: { gas_used: '85000', gas_limit: '21000', recommended_gas: '100000', error: 'out of gas' },
              creationTimestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
              uid: 'bc-pod-tx-relay',
            },
            spec: {
              containers: [{
                name: 'relay',
                image: 'evm:local',
                ports: [],
                env: [{ name: 'TX_STATUS', value: 'failed' }],
                envFrom: [],
              }],
            },
            status: {
              phase: 'CrashLoopBackOff',
              containerStatuses: [{
                name: 'relay',
                ready: false,
                restartCount: 0,
                state: 'waiting',
                stateReason: 'CrashLoopBackOff',
                image: 'evm:local',
              }],
              message: 'Transaction reverted: out of gas at opcode SSTORE',
              reason: 'OutOfGas',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'label-set',
      targetNamespace: 'blockchain',
      targetName: 'tx-relay',
      targetKind: 'Pod',
      expectedLabels: { tx_status: 'included' },
      label: 'Transaction included in block with correct gas limit',
    },
    hints: [
      {
        id: 'bc-h7-1', order: 1,
        text: 'Run `eth estimate batchTransfer` — eth_estimateGas simulates execution and returns the gas units consumed.',
        pointPenalty: 20,
      },
      {
        id: 'bc-h7-2', order: 2,
        text: 'Add a 10–20% buffer above the estimate to handle gas estimation variance. e.g. estimate=85000 → use --gas 95000.',
        pointPenalty: 35,
      },
      {
        id: 'bc-h7-3', order: 3,
        text: 'Run `eth send batchTransfer --gas 95000`. The EVM will use the actual gas consumed; unused gas is refunded to the sender.',
        pointPenalty: 50,
      },
    ],
    solutionCommands: ['eth estimate batchTransfer', 'eth send batchTransfer --gas 95000'],
    teacherNotes: 'Teaches: gas model, eth_estimateGas, gas limit vs gas used, refunds. Contrast with EIP-1559 base fee + tip.',
    conceptId: 'gas-evm',
  },

  // -------------------------------------------------------------------------
  // DeFi — difficulty 3
  // -------------------------------------------------------------------------

  {
    id: 'bc-s08-amm-swap',
    slug: 'uniswap-constant-product',
    name: 'Uniswap: The Constant Product',
    category: 'defi',
    difficulty: 3,
    estimatedMinutes: 10,
    maxPoints: 200,
    description: 'Calculate the swap output using x*y=k and execute the trade at the correct price.',
    story: '🦄 **SWAP TIME** — The ETH/USDC pool has x=1000 ETH and y=2,000,000 USDC (k=2,000,000,000). You want to swap 100 ETH in. Calculate the USDC out and execute the swap.',
    objectives: [
      'Run defi pool status to see current reserves (x, y, k)',
      'Calculate the expected USDC output using x*y=k: new_y = k/(x+100), output = y - new_y',
      'Execute defi swap 100 ETH USDC and verify the output matches your calculation',
    ],
    initialClusterState: {
      namespaces: ['blockchain'],
      currentNamespace: 'blockchain',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'amm-pool-eth-usdc',
              namespace: 'blockchain',
              labels: { type: 'amm-pool', pair: 'ETH-USDC', swap_executed: 'false' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              uid: 'bc-cm-amm-pool',
            },
            data: {
              reserve_x: '1000',
              reserve_y: '2000000',
              k: '2000000000',
              token_x: 'ETH',
              token_y: 'USDC',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'label-set',
      targetNamespace: 'blockchain',
      targetName: 'amm-pool-eth-usdc',
      targetKind: 'ConfigMap',
      expectedLabels: { swap_executed: 'true' },
      label: 'Swap executed at correct x*y=k price',
    },
    hints: [
      {
        id: 'bc-h8-1', order: 1,
        text: 'Run `defi pool status ETH-USDC`. Note: x=1000, y=2000000, k=2000000000.',
        pointPenalty: 20,
      },
      {
        id: 'bc-h8-2', order: 2,
        text: 'Formula: new_y = k / (x + amountIn) = 2000000000 / 1100 ≈ 1818181. Output = 2000000 − 1818181 = 181819 USDC (before fees).',
        pointPenalty: 35,
      },
      {
        id: 'bc-h8-3', order: 3,
        text: 'Run `defi swap 100 ETH USDC`. Verify the output is ~181,819 USDC. This is price impact — large swaps move the price significantly.',
        pointPenalty: 50,
      },
    ],
    solutionCommands: ['defi pool status ETH-USDC', 'defi swap 100 ETH USDC'],
    teacherNotes: 'Teaches: AMM constant product formula, price impact, slippage. Ask students to compute what happens if they swap 900 ETH instead.',
    conceptId: 'amm-formula',
  },

  {
    id: 'bc-s09-lending-borrow',
    slug: 'aave-borrow-against-collateral',
    name: 'Aave: Borrow Against Collateral',
    category: 'defi',
    difficulty: 3,
    estimatedMinutes: 10,
    maxPoints: 200,
    description: 'Deposit ETH as collateral, borrow USDC, and ensure the health factor stays above 1.',
    story: '🏦 **LEVERAGE UP** — You want to borrow USDC without selling your ETH. Deposit 1 ETH into Aave, borrow 1000 USDC, then check the health factor to make sure you won\'t get liquidated.',
    objectives: [
      'Deposit 1 ETH as collateral with defi deposit 1 ETH',
      'Borrow 1000 USDC against that collateral with defi borrow 1000 USDC',
      'Run defi health-factor and confirm the value is above 1.0',
    ],
    initialClusterState: {
      namespaces: ['blockchain'],
      currentNamespace: 'blockchain',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'aave-position',
              namespace: 'blockchain',
              labels: { protocol: 'aave', health: 'none', borrowing: 'false' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
              uid: 'bc-cm-aave',
            },
            data: {
              collateral_ETH: '0',
              borrowed_USDC: '0',
              health_factor: 'inf',
              ltv: '0.80',
              liquidation_threshold: '0.825',
            },
          },
        },
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'eth-price-oracle',
              namespace: 'blockchain',
              labels: { type: 'price-oracle' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
              uid: 'bc-cm-eth-oracle',
            },
            data: {
              eth_usd: '2000',
              ltv: '0.80',
              liquidation_threshold: '0.825',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'label-set',
      targetNamespace: 'blockchain',
      targetName: 'aave-position',
      targetKind: 'ConfigMap',
      expectedLabels: { borrowing: 'true', health: 'safe' },
      label: 'Health factor > 1 after depositing collateral and borrowing',
    },
    hints: [
      {
        id: 'bc-h9-1', order: 1,
        text: 'Check the oracle: `chain inspect configmap eth-price-oracle`. ETH is at $2000. With 80% LTV, 1 ETH lets you borrow up to $1600 USDC.',
        pointPenalty: 20,
      },
      {
        id: 'bc-h9-2', order: 2,
        text: 'Run `defi deposit 1 ETH` — Aave mints aETH tokens representing your collateral position. Then run `defi borrow 1000 USDC` — borrowing $1000 is well within the $1600 limit.',
        pointPenalty: 35,
      },
      {
        id: 'bc-h9-3', order: 3,
        text: 'Health Factor = (collateral × liquidation_threshold) / debt. HF = (2000 × 0.825) / 1000 = 1.65. HF < 1 triggers liquidation.',
        pointPenalty: 50,
      },
    ],
    solutionCommands: ['defi deposit 1 ETH', 'defi borrow 1000 USDC', 'defi health-factor'],
    teacherNotes: 'Teaches: collateralized lending, LTV, health factor, liquidation. Ask: what ETH price would cause liquidation here?',
    conceptId: 'lending-protocol',
  },

  {
    id: 'bc-s10-reentrancy-attack',
    slug: 'reentrancy-attack',
    name: 'Reentrancy Attack',
    category: 'security',
    difficulty: 3,
    estimatedMinutes: 12,
    maxPoints: 200,
    description: 'A lending contract is vulnerable to reentrancy. Identify the vulnerability and apply the checks-effects-interactions fix.',
    story: '🐛 **SECURITY AUDIT** — The QuickLend contract has been flagged. Its withdraw() sends ETH before updating the balance, enabling reentrancy. Run the scanner, then apply the fix.',
    objectives: [
      'Run audit scan Contract.sol to detect the reentrancy vulnerability',
      'Understand why sending ETH before updating state is dangerous',
      'Apply the fix with audit fix reentrancy and verify the audit passes',
    ],
    initialClusterState: {
      namespaces: ['blockchain'],
      currentNamespace: 'blockchain',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'quicklend-contract',
              namespace: 'blockchain',
              labels: { type: 'solidity-source', audit_status: 'unscanned', vuln_fixed: 'false' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
              uid: 'bc-cm-quicklend',
            },
            data: {
              filename: 'Contract.sol',
              vulnerability: 'reentrancy',
              source: 'function withdraw(uint amount) external {\n  require(balances[msg.sender] >= amount);\n  (bool ok,) = msg.sender.call{value: amount}("");\n  require(ok);\n  balances[msg.sender] -= amount; // BUG: state updated after external call\n}',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'label-set',
      targetNamespace: 'blockchain',
      targetName: 'quicklend-contract',
      targetKind: 'ConfigMap',
      expectedLabels: { audit_status: 'passed', vuln_fixed: 'true' },
      label: 'Reentrancy patched and audit passes',
    },
    hints: [
      {
        id: 'bc-h10-1', order: 1,
        text: 'Run `audit scan Contract.sol` — the scanner checks for CEI (Checks-Effects-Interactions) violations.',
        pointPenalty: 20,
      },
      {
        id: 'bc-h10-2', order: 2,
        text: 'The bug: ETH is sent (interaction) before balances[msg.sender] is decremented (effect). A malicious receive() can re-enter withdraw() before the balance is zeroed.',
        pointPenalty: 35,
      },
      {
        id: 'bc-h10-3', order: 3,
        text: 'Run `audit fix reentrancy` — fix: move `balances[msg.sender] -= amount` BEFORE the external call. Pattern: 1) Check 2) Effect 3) Interact.',
        pointPenalty: 50,
      },
    ],
    solutionCommands: ['audit scan Contract.sol', 'audit fix reentrancy'],
    teacherNotes: 'Teaches: reentrancy attack, CEI pattern, The DAO hack. Consider showing ReentrancyGuard mutex as alternative.',
    conceptId: 'reentrancy',
  },

  // -------------------------------------------------------------------------
  // Hyperledger — difficulty 3
  // -------------------------------------------------------------------------

  {
    id: 'bc-s11-fabric-chaincode',
    slug: 'deploy-chaincode-on-fabric',
    name: 'Deploy Chaincode on Fabric',
    category: 'hyperledger',
    difficulty: 3,
    estimatedMinutes: 12,
    maxPoints: 200,
    description: 'Package, install, approve, and commit chaincode on a Hyperledger Fabric network.',
    story: '🏭 **ENTERPRISE DEPLOY** — The consortium is ready to go live with the AssetTransfer chaincode. Follow the Fabric lifecycle: package → install on peers → approve for each org → commit to channel.',
    objectives: [
      'Package the chaincode with fabric peer chaincode package',
      'Install the package on both Org1 and Org2 peers',
      'Approve the chaincode definition from both organizations',
      'Commit the chaincode to the channel',
    ],
    initialClusterState: {
      namespaces: ['fabric'],
      currentNamespace: 'fabric',
      resources: [
        {
          kind: 'Deployment',
          spec: {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
              name: 'fabric-network',
              namespace: 'fabric',
              labels: { type: 'hyperledger-fabric', chaincode_committed: 'false' },
              annotations: { channel: 'mychannel', orgs: 'Org1,Org2' },
              creationTimestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
              uid: 'bc-deploy-fabric',
            },
            spec: {
              replicas: 3,
              selector: { matchLabels: { type: 'hyperledger-fabric' } },
              template: {
                metadata: { labels: { type: 'hyperledger-fabric' }, annotations: {} },
                spec: {
                  containers: [{
                    name: 'peer',
                    image: 'hyperledger/fabric-peer:2.5',
                    ports: [{ containerPort: 7051 }],
                    env: [{ name: 'CHAINCODE_STATUS', value: 'not-installed' }],
                    envFrom: [],
                  }],
                },
              },
            },
            status: {
              replicas: 3,
              readyReplicas: 3,
              availableReplicas: 3,
              unavailableReplicas: 0,
              conditions: [{ type: 'Available', status: 'True' }],
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'label-set',
      targetNamespace: 'fabric',
      targetName: 'fabric-network',
      targetKind: 'Deployment',
      expectedLabels: { chaincode_committed: 'true' },
      label: 'Chaincode committed to channel after full lifecycle',
    },
    hints: [
      {
        id: 'bc-h11-1', order: 1,
        text: 'Run `peer lifecycle chaincode package AssetTransfer.tar.gz --path ./chaincode --lang node` to create the installable package.',
        pointPenalty: 20,
      },
      {
        id: 'bc-h11-2', order: 2,
        text: 'Install on each peer: `peer lifecycle chaincode install AssetTransfer.tar.gz` for Org1 peer, repeat for Org2 peer.',
        pointPenalty: 35,
      },
      {
        id: 'bc-h11-3', order: 3,
        text: 'Approve with each org\'s admin: `peer lifecycle chaincode approveformyorg --channelID mychannel --name AssetTransfer --version 1.0 --sequence 1`. Then commit: `peer lifecycle chaincode commit ...`',
        pointPenalty: 50,
      },
    ],
    solutionCommands: [
      'peer lifecycle chaincode package',
      'peer lifecycle chaincode install',
      'peer lifecycle chaincode approveformyorg',
      'peer lifecycle chaincode commit',
    ],
    teacherNotes: 'Teaches: Fabric 2.x chaincode lifecycle (package→install→approve→commit). Contrast with Fabric 1.x instantiate model.',
    conceptId: 'fabric-lifecycle',
  },

  {
    id: 'bc-s12-fabric-channel',
    slug: 'create-private-channel',
    name: 'Create a Private Channel',
    category: 'hyperledger',
    difficulty: 3,
    estimatedMinutes: 10,
    maxPoints: 200,
    description: 'Create a Fabric channel, join peers from two organizations, and update anchor peers.',
    story: '🔒 **PRIVATE CHANNEL** — Org1 and Org2 need a private channel for confidential transactions. Create the channel, join peers from both orgs, and configure anchor peers for gossip.',
    objectives: [
      'Create the channel using fabric channel create',
      'Join Org1 and Org2 peers to the channel',
      'Update anchor peers for each organization',
    ],
    initialClusterState: {
      namespaces: ['fabric'],
      currentNamespace: 'fabric',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'fabric-channels',
              namespace: 'fabric',
              labels: { channel_created: 'false', peers_joined: '0' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
              uid: 'bc-cm-fabric-channels',
            },
            data: {
              channel_name: 'privatechannel',
              org1_peer: 'peer0.org1.example.com:7051',
              org2_peer: 'peer0.org2.example.com:7051',
              anchor_peers_set: 'false',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'label-set',
      targetNamespace: 'fabric',
      targetName: 'fabric-channels',
      targetKind: 'ConfigMap',
      expectedLabels: { channel_created: 'true', peers_joined: '2' },
      label: 'Channel created with 2 peers joined and anchor peers set',
    },
    hints: [
      {
        id: 'bc-h12-1', order: 1,
        text: 'Run `peer channel create -c privatechannel -f channel.tx` — this submits the channel genesis block to the orderer.',
        pointPenalty: 20,
      },
      {
        id: 'bc-h12-2', order: 2,
        text: 'Fetch and join: `peer channel fetch 0 privatechannel.block` then `peer channel join -b privatechannel.block` for each peer.',
        pointPenalty: 35,
      },
      {
        id: 'bc-h12-3', order: 3,
        text: 'Update anchor peers so gossip works across orgs: `peer channel update -c privatechannel -f Org1MSPanchors.tx`.',
        pointPenalty: 50,
      },
    ],
    solutionCommands: [
      'peer channel create -c privatechannel -f channel.tx',
      'peer channel join -b privatechannel.block',
      'peer channel update -c privatechannel -f Org1MSPanchors.tx',
    ],
    teacherNotes: 'Teaches: Fabric channel isolation model, gossip protocol, anchor peers. Compare with Ethereum\'s single shared ledger.',
    conceptId: 'fabric-channels',
  },

  // -------------------------------------------------------------------------
  // Layer 2 & Advanced — difficulty 4
  // -------------------------------------------------------------------------

  {
    id: 'bc-s13-rollup-submit',
    slug: 'submit-batch-to-rollup',
    name: 'Submit a Batch to Rollup',
    category: 'layer2',
    difficulty: 4,
    estimatedMinutes: 15,
    maxPoints: 300,
    description: 'Collect L2 transactions, generate a state root proof, and submit the batch to the L1 rollup contract.',
    story: '🚀 **ROLLUP BATCH** — The L2 sequencer has accumulated 500 transactions. Collect them, generate the state root, and submit the batch to the L1 rollup contract to finalise them cheaply.',
    objectives: [
      'Collect pending L2 transactions with rollup collect',
      'Generate the state root and validity proof with rollup prove',
      'Submit the batch to L1 with rollup submit and confirm acceptance',
    ],
    initialClusterState: {
      namespaces: ['blockchain'],
      currentNamespace: 'blockchain',
      resources: [
        {
          kind: 'Deployment',
          spec: {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
              name: 'l2-sequencer',
              namespace: 'blockchain',
              labels: { type: 'rollup-sequencer', batch_submitted: 'false' },
              annotations: { pending_txs: '500', l1_contract: '0xRollup...' },
              creationTimestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
              uid: 'bc-deploy-sequencer',
            },
            spec: {
              replicas: 1,
              selector: { matchLabels: { type: 'rollup-sequencer' } },
              template: {
                metadata: { labels: { type: 'rollup-sequencer' }, annotations: {} },
                spec: {
                  containers: [{
                    name: 'sequencer',
                    image: 'optimism/sequencer:latest',
                    ports: [{ containerPort: 8547 }],
                    env: [{ name: 'BATCH_STATUS', value: 'pending' }],
                    envFrom: [],
                  }],
                },
              },
            },
            status: {
              replicas: 1,
              readyReplicas: 1,
              availableReplicas: 1,
              unavailableReplicas: 0,
              conditions: [{ type: 'Available', status: 'True' }],
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'label-set',
      targetNamespace: 'blockchain',
      targetName: 'l2-sequencer',
      targetKind: 'Deployment',
      expectedLabels: { batch_submitted: 'true' },
      label: 'Batch accepted on L1 rollup contract',
    },
    hints: [
      {
        id: 'bc-h13-1', order: 1,
        text: 'Run `rollup collect` — the sequencer batches pending L2 transactions into a compressed calldata blob.',
        pointPenalty: 30,
      },
      {
        id: 'bc-h13-2', order: 2,
        text: 'Run `rollup prove` — this generates the state root commitment (Merkle root of all post-tx state). Note: this is an optimistic rollup — it uses fraud proofs (challengers dispute invalid batches), not validity proofs (which ZK rollups use). The state root is posted first; disputes come later.',
        pointPenalty: 50,
      },
      {
        id: 'bc-h13-3', order: 3,
        text: 'Run `rollup submit` — sends the state root + compressed batch to the L1 rollup contract. L1 stores just the root; dispute window starts.',
        pointPenalty: 75,
      },
    ],
    solutionCommands: ['rollup collect', 'rollup prove', 'rollup submit'],
    teacherNotes: 'Teaches: optimistic vs ZK rollup architecture, state root, data availability, fraud proof window. Compare Arbitrum vs zkSync.',
    conceptId: 'rollup-architecture',
  },

  {
    id: 'bc-s14-bridge-transfer',
    slug: 'cross-chain-bridge',
    name: 'Cross-Chain Bridge',
    category: 'layer2',
    difficulty: 4,
    estimatedMinutes: 12,
    maxPoints: 300,
    description: 'Lock tokens on L1 and mint the wrapped equivalent on L2 via the canonical bridge.',
    story: '🌉 **BRIDGE CROSSING** — You need 100 USDC on L2. Lock them in the L1 bridge contract; the bridge relayer will mint wrapped USDC on L2. Verify the mint completes.',
    objectives: [
      'Lock 100 USDC in the L1 bridge with bridge lock 100 USDC --l1',
      'Wait for the bridge relayer to relay the message to L2',
      'Mint the wrapped USDC on L2 with bridge mint --l2',
    ],
    initialClusterState: {
      namespaces: ['blockchain'],
      currentNamespace: 'blockchain',
      resources: [
        {
          kind: 'ConfigMap',
          spec: {
            apiVersion: 'v1',
            kind: 'ConfigMap',
            metadata: {
              name: 'bridge-state',
              namespace: 'blockchain',
              labels: { l1_locked: 'false', l2_minted: 'false' },
              annotations: { l1_contract: '0xL1Bridge', l2_contract: '0xL2Bridge' },
              creationTimestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
              uid: 'bc-cm-bridge',
            },
            data: {
              l1_usdc_balance: '1000',
              l2_usdc_balance: '0',
              bridge_message_status: 'none',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'label-set',
      targetNamespace: 'blockchain',
      targetName: 'bridge-state',
      targetKind: 'ConfigMap',
      expectedLabels: { l1_locked: 'true', l2_minted: 'true' },
      label: 'Tokens locked on L1 and minted on L2',
    },
    hints: [
      {
        id: 'bc-h14-1', order: 1,
        text: 'Run `bridge lock 100 USDC --l1` — this calls the L1 bridge contract which transfers USDC to the escrow and emits a DepositInitiated event.',
        pointPenalty: 30,
      },
      {
        id: 'bc-h14-2', order: 2,
        text: 'The bridge relayer watches L1 for DepositInitiated events, constructs a cross-chain message, and submits it to L2.',
        pointPenalty: 50,
      },
      {
        id: 'bc-h14-3', order: 3,
        text: 'Run `bridge mint --l2` — on L2 the bridge contract verifies the message proof and mints 100 wUSDC to your L2 address.',
        pointPenalty: 75,
      },
    ],
    solutionCommands: ['bridge lock 100 USDC --l1', 'bridge mint --l2'],
    teacherNotes: 'Teaches: lock-and-mint bridge pattern, cross-chain message passing, relayer role, wrapped tokens. Discuss bridge hacks (Ronin, Wormhole).',
    conceptId: 'bridge-mechanism',
  },

  {
    id: 'bc-s15-wallet-recovery',
    slug: 'recover-wallet-from-mnemonic',
    name: 'Recover Wallet from Mnemonic',
    category: 'wallets',
    difficulty: 4,
    estimatedMinutes: 10,
    maxPoints: 300,
    description: 'Recover a lost wallet using a BIP-39 mnemonic phrase and derive the correct address via the BIP-44 derivation path.',
    story: '🆘 **WALLET RECOVERY** — A user lost their hardware wallet but still has their 12-word BIP-39 mnemonic. Restore the wallet and derive the first Ethereum account to prove ownership.',
    objectives: [
      'Recover the seed from the mnemonic with wallet recover "word1 word2 ..."',
      'Derive the Ethereum account using BIP-44 path m/44\'/60\'/0\'/0/0',
      'Confirm the derived address matches the expected 0x address',
    ],
    initialClusterState: {
      namespaces: ['blockchain'],
      currentNamespace: 'blockchain',
      resources: [
        {
          kind: 'Secret',
          spec: {
            apiVersion: 'v1',
            kind: 'Secret',
            type: 'Opaque',
            metadata: {
              name: 'recovery-wallet',
              namespace: 'blockchain',
              labels: { recovered: 'false', address_derived: 'false' },
              annotations: {},
              creationTimestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
              uid: 'bc-secret-recovery',
            },
            data: {
              mnemonic: 'cGFuZGEgc2FsYWQgYmFsbCBjYW5lIHdpdGNoIGdyYXBlIGZlZWwgYXBwbGUgZHJ1bSBmbHV4IGx1bmdzIG1hcHBlZA==',
              expected_address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
              derived_address: '',
            },
          },
        },
      ],
    },
    winCondition: {
      type: 'label-set',
      targetNamespace: 'blockchain',
      targetName: 'recovery-wallet',
      targetKind: 'Secret',
      expectedLabels: { recovered: 'true', address_derived: 'true' },
      label: 'Correct address derived from mnemonic using BIP-44 path',
    },
    hints: [
      {
        id: 'bc-h15-1', order: 1,
        text: 'Run `wallet recover "word1 word2 ..."` with the 12-word phrase. This converts the mnemonic to a 512-bit seed via PBKDF2-HMAC-SHA512.',
        pointPenalty: 30,
      },
      {
        id: 'bc-h15-2', order: 2,
        text: 'Run `wallet derive --path m/44\'/60\'/0\'/0/0` — the BIP-44 path for Ethereum: purpose=44, coin=60, account=0, change=0, index=0.',
        pointPenalty: 50,
      },
      {
        id: 'bc-h15-3', order: 3,
        text: 'Compare the derived address to the expected address. If they match, you\'ve proven ownership. The mnemonic is the ultimate backup — store it offline.',
        pointPenalty: 75,
      },
    ],
    solutionCommands: [
      'wallet recover "panda salad ball cane witch grape feel apple drum flux lungs mapped"',
      'wallet derive --path m/44\'/60\'/0\'/0/0',
    ],
    teacherNotes: 'Teaches: BIP-39 mnemonic, BIP-32 HD wallet derivation, BIP-44 path structure. Discuss seed phrase security, passphrase (25th word), hardware wallets.',
    conceptId: 'hd-wallet',
  },
];

// ---------------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------------

const blockchainCharacters: Character[] = [
  {
    id: 'operator',
    name: 'Satoshi the Miner',
    title: 'Proof-of-Work Expert',
    description: 'PoW mining veteran. Deep knowledge of hash functions, nonce iteration, and consensus. Gets extra time and a points bonus on fundamentals and consensus scenarios.',
    avatarEmoji: '⛏️',
    primaryColor: '#F59E0B',
    flavor: '"If the hash doesn\'t start with enough zeros, keep grinding."',
    buff: {
      id: 'satoshi-buff',
      name: 'Block Miner',
      description: '+30% on blockchain fundamentals, +20% on wallets, +30s timer',
      categoryMultiplier: { 'blockchain-fundamentals': 1.3, wallets: 1.2 },
      hintCostReduction: 0,
      timeBonus: 30,
      streakProtection: false,
    },
  },
  {
    id: 'developer',
    name: 'Vitalik the Architect',
    title: 'EVM Protocol Designer',
    description: 'Creator-level understanding of the EVM, Solidity, and DeFi primitives. Earns 25% more on EVM and DeFi scenarios.',
    avatarEmoji: '🏗️',
    primaryColor: '#6366F1',
    flavor: '"The EVM is a world computer. Treat it like one."',
    buff: {
      id: 'vitalik-buff',
      name: 'Protocol Visionary',
      description: '+30% on ethereum, +25% on tokens, +15% on defi, streak protection',
      categoryMultiplier: { ethereum: 1.3, tokens: 1.25, defi: 1.15 },
      hintCostReduction: 0,
      timeBonus: 0,
      streakProtection: true,
    },
  },
  {
    id: 'sre',
    name: 'Gavin the Parachain Dev',
    title: 'Layer 2 & Interop Expert',
    description: 'Cross-chain and rollup specialist. Earns 30% more on Layer 2, bridge, and interoperability scenarios.',
    avatarEmoji: '🔗',
    primaryColor: '#EC4899',
    flavor: '"One chain is a single point of failure. Build the multichain."',
    buff: {
      id: 'gavin-buff',
      name: 'Parachain Pioneer',
      description: '+30% on layer2 scenarios, +20% on security scenarios',
      categoryMultiplier: { layer2: 1.3, security: 1.2 },
      hintCostReduction: 0.1,
      timeBonus: 0,
      streakProtection: false,
    },
  },
  {
    id: 'architect',
    name: 'Fabric the Enterprise Dev',
    title: 'Hyperledger Specialist',
    description: 'Hyperledger Fabric expert. Earns 25% more on Fabric and enterprise blockchain scenarios. Hint cost reduced by 40%.',
    avatarEmoji: '🏢',
    primaryColor: '#10B981',
    flavor: '"Permissioned doesn\'t mean powerless."',
    buff: {
      id: 'fabric-buff',
      name: 'Enterprise Chain Master',
      description: '+30% on hyperledger scenarios, +15% on smart-contracts, hint cost -40%',
      categoryMultiplier: { hyperledger: 1.3, 'smart-contracts': 1.15 },
      hintCostReduction: 0.4,
      timeBonus: 0,
      streakProtection: false,
    },
  },
];

// ---------------------------------------------------------------------------
// Course export
// ---------------------------------------------------------------------------

export const blockchainCourse: Course = {
  id: 'blockchain',
  name: 'Blockchain Engineering',
  icon: '⛓️',
  description: 'Master blockchain fundamentals, Ethereum smart contracts, DeFi protocols, Hyperledger Fabric, and Layer 2 scaling through hands-on engineering scenarios.',
  terminalPrompt: '⛓ blockchain $ ',
  terminalWelcome: [
    '\x1b[33m╔══════════════════════════════════════╗\x1b[0m',
    '\x1b[33m║   Blockchain Engineering Simulator   ║\x1b[0m',
    '\x1b[33m║   Type commands to interact with     ║\x1b[0m',
    '\x1b[33m║   the chain                          ║\x1b[0m',
    '\x1b[33m╚══════════════════════════════════════╝\x1b[0m',
  ],
  scenarios: blockchainScenarios,
  characters: blockchainCharacters,
};
