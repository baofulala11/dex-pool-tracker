import { Chain, DEX, ChainId } from '@/types';

export const CHAINS: Record<ChainId, Chain> = {
  bsc: {
    id: 'bsc',
    name: 'BNB Chain',
    nativeCurrency: 'BNB',
    explorerUrl: 'https://bscscan.com',
  },
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    nativeCurrency: 'ETH',
    explorerUrl: 'https://etherscan.io',
  },
  base: {
    id: 'base',
    name: 'Base',
    nativeCurrency: 'ETH',
    explorerUrl: 'https://basescan.org',
  },
};

export const DEX_LIST: DEX[] = [
  {
    id: 'pancakeswap-v3-bsc',
    name: 'PancakeSwap V3',
    chain: 'bsc',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc',
    version: 'v3',
  },
  {
    id: 'uniswap-v3-bsc',
    name: 'Uniswap V3',
    chain: 'bsc',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-bsc',
    version: 'v3',
  },
  {
    id: 'uniswap-v3-eth',
    name: 'Uniswap V3',
    chain: 'ethereum',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
    version: 'v3',
  },
  {
    id: 'sushiswap-v3-eth',
    name: 'SushiSwap V3',
    chain: 'ethereum',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/sushi-v3/v3-ethereum',
    version: 'v3',
  },
  {
    id: 'uniswap-v3-base',
    name: 'Uniswap V3',
    chain: 'base',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-base',
    version: 'v3',
  },
  {
    id: 'aerodrome-base',
    name: 'Aerodrome',
    chain: 'base',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/aerodrome-finance/aerodrome-cl',
    version: 'v3',
  },
];

export function getDEXsByChain(chain: ChainId): DEX[] {
  return DEX_LIST.filter(dex => dex.chain === chain);
}

export function getAllDEXs(): DEX[] {
  return DEX_LIST;
}
