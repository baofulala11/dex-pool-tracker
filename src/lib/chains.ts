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
  // BSC
  {
    id: 'pancakeswap-v3-bsc',
    name: 'PancakeSwap',
    chain: 'bsc',
    subgraphId: '78EUqzJmEVJsAKvWghn7qotf9LVGqcTQxJhT5z84ZmgJ',
    version: 'v3',
  },
  // Ethereum
  {
    id: 'uniswap-v3-eth',
    name: 'Uniswap',
    chain: 'ethereum',
    subgraphId: '5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV',
    version: 'v3',
  },
  // Base
  {
    id: 'uniswap-v3-base',
    name: 'Uniswap',
    chain: 'base',
    subgraphId: '43Hwfi3dJSoGpyas9VwNoDAv55yjgGrPpNSmbQZArzMG',
    version: 'v3',
  },
];

export function getDEXsByChain(chain: ChainId): DEX[] {
  return DEX_LIST.filter(dex => dex.chain === chain);
}

export function getAllDEXs(): DEX[] {
  return DEX_LIST;
}
