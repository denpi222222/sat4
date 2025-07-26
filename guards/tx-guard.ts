import { Address, Hex, decodeFunctionData, parseAbiItem, getAddress } from 'viem';

export type Risk =
  | 'UNKNOWN_FUNCTION'
  | 'APPROVAL_UNLIMITED'
  | 'SET_APPROVAL_FOR_ALL'
  | 'PERMIT_UNLIMITED'
  | 'PERMIT2_UNLIMITED'
  | 'TRANSFER_TO_UNKNOWN'
  | 'BRIDGE_TO_UNKNOWN'
  | 'MULTICALL'
  | 'NON_WHITELIST_CONTRACT'
  | 'DIFFERENT_CHAIN'
  | 'ZERO_VALUE_APPROVAL'
  | 'BIG_VALUE';

export interface TxMeta {
  from?: Address;
  to?: Address;
  data?: Hex;
  value?: bigint;
  chainId?: number;
}

export interface TxAnalysis {
  ok: boolean;
  risks: Risk[];
  decoded?: {
    name: string;
    args: any;
  } | null;
}

export interface GuardConfig {
  whitelistContracts: Address[];
  whitelistChainIds: number[];
  maxNativeValue?: bigint;
}

const APPROVE = parseAbiItem('function approve(address spender, uint256 value)');
const SET_APPROVAL_FOR_ALL = parseAbiItem('function setApprovalForAll(address operator, bool approved)');
const PERMIT = parseAbiItem('function permit(address owner,address spender,uint256 value,uint256 deadline,uint8 v,bytes32 r,bytes32 s)');
const MULTICALL = parseAbiItem('function multicall(bytes[] data)');

export function analyzeTx(tx: TxMeta, cfg: GuardConfig): TxAnalysis {
  const risks: Risk[] = [];
  if (!tx.to) return { ok: false, risks: ['NON_WHITELIST_CONTRACT'] };

  const to = getAddress(tx.to);

  if (cfg.whitelistContracts.length && !cfg.whitelistContracts.map(getAddress).includes(to)) {
    risks.push('NON_WHITELIST_CONTRACT');
  }

  if (typeof tx.chainId === 'number' && cfg.whitelistChainIds.length && !cfg.whitelistChainIds.includes(tx.chainId)) {
    risks.push('DIFFERENT_CHAIN');
  }

  if (tx.value && cfg.maxNativeValue && tx.value > cfg.maxNativeValue) {
    risks.push('BIG_VALUE');
  }

  if (!tx.data || tx.data === '0x') {
    return { ok: risks.length === 0, risks };
  }

  try {
    const candidates = [APPROVE, SET_APPROVAL_FOR_ALL, PERMIT, MULTICALL];
    for (const abi of candidates) {
      try {
        const decoded = decodeFunctionData({ abi: [abi], data: tx.data as Hex });
        if (decoded.functionName === 'approve') {
          const [_spender, value] = decoded.args as [Address, bigint];
          if (value > 2n ** 255n) risks.push('APPROVAL_UNLIMITED');
          if (cfg.whitelistContracts.length && !cfg.whitelistContracts.map(getAddress).includes(getAddress(_spender))) {
            risks.push('TRANSFER_TO_UNKNOWN');
          }
          return { ok: risks.length === 0, risks, decoded: { name: 'approve', args: decoded.args } };
        }

        if (decoded.functionName === 'setApprovalForAll') {
          const [operator, approved] = decoded.args as [Address, boolean];
          if (approved) risks.push('SET_APPROVAL_FOR_ALL');
          if (cfg.whitelistContracts.length && !cfg.whitelistContracts.map(getAddress).includes(getAddress(operator))) {
          risks.push('TRANSFER_TO_UNKNOWN');
          }
          return { ok: risks.length === 0, risks, decoded: { name: 'setApprovalForAll', args: decoded.args } };
        }

        if (decoded.functionName === 'permit') {
          const [_owner, spender, value] = decoded.args as readonly [Address, Address, bigint, bigint, number, `0x${string}`, `0x${string}`];
          if (value > 2n ** 255n) risks.push('PERMIT_UNLIMITED');
          if (cfg.whitelistContracts.length && !cfg.whitelistContracts.map(getAddress).includes(getAddress(spender))) {
            risks.push('TRANSFER_TO_UNKNOWN');
          }
          return { ok: risks.length === 0, risks, decoded: { name: 'permit', args: decoded.args } };
        }

        if (decoded.functionName === 'multicall') {
          risks.push('MULTICALL');
          return { ok: risks.length === 0, risks, decoded: { name: 'multicall', args: decoded.args } };
        }
      } catch (_) {}
    }

    risks.push('UNKNOWN_FUNCTION');
    return { ok: risks.length === 0, risks, decoded: null };
  } catch (e) {
    risks.push('UNKNOWN_FUNCTION');
    return { ok: risks.length === 0, risks, decoded: null };
  }
}
