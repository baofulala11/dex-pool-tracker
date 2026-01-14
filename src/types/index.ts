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
  subgraphUrl: string;
  version: 'v2' | 'v3';
}

export interface Token {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
}

export interface PoolResult {
  platform: string;
  chain: ChainId;
  pair: string;
  feeTier: string;
  priceRange: string;
  currentPrice: string;
  tvlUSD: string;
  volume24hUSD: string;
  priceLower: number;
  priceUpper: number;
  currentPriceNum: number;
}
