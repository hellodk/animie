import { lazy } from 'react';
import type React from 'react';

const concepts: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'pod-lifecycle':    lazy(() => import('./PodLifecycle')),
  'deployment-scale': lazy(() => import('./DeploymentScale')),
  'image-tag':        lazy(() => import('./ImageTag')),
  'service-selector': lazy(() => import('./ServiceSelector')),
  'secret-injection': lazy(() => import('./SecretInjection')),
  'rbac-flow':        lazy(() => import('./RbacFlow')),
  'hpa-scaling':      lazy(() => import('./HpaScaling')),
  'ingress-routing':  lazy(() => import('./IngressRouting')),
  'rollback-history': lazy(() => import('./RollbackHistory')),
  // Crucible: Smart Contract Security
  'forge-test':          lazy(() => import('./crucible/ForgeTest')),
  'stack-trace':         lazy(() => import('./crucible/StackTrace')),
  'fuzz-testing':        lazy(() => import('./crucible/FuzzTesting')),
  'invariant-testing':   lazy(() => import('./crucible/InvariantTesting')),
  'reentrancy-exploit':  lazy(() => import('./crucible/ReentrancyExploit')),
  'access-control':      lazy(() => import('./crucible/AccessControl')),
  'flash-loan-testing':  lazy(() => import('./crucible/FlashLoanTesting')),
  'symbolic-exec':       lazy(() => import('./crucible/SymbolicExec')),
  // Blockchain Engineering
  'block-anatomy':        lazy(() => import('./blockchain/BlockAnatomy')),
  'hash-chain':           lazy(() => import('./blockchain/HashChain')),
  'wallet-keys':          lazy(() => import('./blockchain/WalletKeys')),
  'erc20-token':          lazy(() => import('./blockchain/Erc20Token')),
  'erc20-allowance':      lazy(() => import('./blockchain/Erc20Allowance')),
  'erc721-nft':           lazy(() => import('./blockchain/Erc721Nft')),
  'amm-formula':          lazy(() => import('./blockchain/AmmFormula')),
  'fabric-lifecycle':     lazy(() => import('./blockchain/FabricLifecycle')),
  'rollup-architecture':  lazy(() => import('./blockchain/RollupArchitecture')),
};

export default concepts;

export function getConceptComponent(id: string): React.LazyExoticComponent<React.ComponentType> | null {
  return concepts[id] ?? null;
}
