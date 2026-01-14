export type ChainId = 'bsc' | 'ethereum' | 'base';

export interface Chain {
  id: ChainId;
  name: string;
  nativeCurrency: string;
  explorerUrl: string;
}

export interface DEX {
  id: string;
  name: string;
  chain: ChainId;
  subgraphId: string;
  version: 'v2' | 'v3';
}

export interface PositionResult {
  rank: number;
  id: string;
  owner: string;
  liquidityUSD: string;
  priceLower: string;
  priceUpper: string;
  isInRange: boolean;
  platform: string;
  chain: ChainId;
  pair: string;
  feeTier: string;
}

export interface PoolResult {
  platform: string;
  chain: ChainId;
  pair: string;
  feeTier: string;
  tvlUSD: string;
  volume24hUSD: string;
  currentPrice: string;
  priceRange: string;
  priceLower: number;
  priceUpper: number;
  currentPriceNum: number;
  positions: PositionResult[];
}
