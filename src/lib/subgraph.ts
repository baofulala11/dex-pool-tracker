import { DEX, PoolResult, ChainId } from '@/types';
import { DEX_LIST } from './chains';

const POOLS_QUERY = `
  query GetPoolsByToken($tokenAddress: String!, $first: Int!) {
    pools0: pools(first: $first, where: { token0: $tokenAddress }, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
      token0 { id symbol name decimals }
      token1 { id symbol name decimals }
      feeTier
      sqrtPrice
      tick
      liquidity
      totalValueLockedUSD
      volumeUSD
    }
    pools1: pools(first: $first, where: { token1: $tokenAddress }, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
      token0 { id symbol name decimals }
      token1 { id symbol name decimals }
      feeTier
      sqrtPrice
      tick
      liquidity
      totalValueLockedUSD
      volumeUSD
    }
  }
`;

function tickToPrice(tick: number, decimals0: number, decimals1: number): number {
  return Math.pow(1.0001, tick) * Math.pow(10, decimals0 - decimals1);
}

function sqrtPriceToPrice(sqrtPriceX96: string, decimals0: number, decimals1: number): number {
  const sqrtPrice = BigInt(sqrtPriceX96);
  const Q96 = BigInt(2) ** BigInt(96);
  const price = Number(sqrtPrice * sqrtPrice) / Number(Q96 * Q96);
  return price * Math.pow(10, decimals0 - decimals1);
}

function formatFeeTier(feeTier: number): string {
  return (feeTier / 10000).toFixed(2) + '%';
}

function formatUSD(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num >= 1000000) return '$' + (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return '$' + (num / 1000).toFixed(2) + 'K';
  return '$' + num.toFixed(2);
}

function formatPrice(price: number): string {
  if (price >= 1000) return '$' + price.toFixed(2);
  if (price >= 1) return '$' + price.toFixed(4);
  if (price >= 0.0001) return '$' + price.toFixed(6);
  return '$' + price.toExponential(4);
}

interface RawPool {
  id: string;
  token0: { id: string; symbol: string; name: string; decimals: string | number };
  token1: { id: string; symbol: string; name: string; decimals: string | number };
  feeTier: string | number;
  sqrtPrice: string;
  tick: string | number;
  liquidity: string;
  totalValueLockedUSD: string;
  volumeUSD: string;
}

async function querySubgraph(dex: DEX, tokenAddress: string): Promise<PoolResult[]> {
  const results: PoolResult[] = [];
  const normalizedAddress = tokenAddress.toLowerCase();

  try {
    const response = await fetch(dex.subgraphUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: POOLS_QUERY,
        variables: { tokenAddress: normalizedAddress, first: 20 },
      }),
    });

    const data = await response.json();
    if (data.errors) {
      console.error('Subgraph error for ' + dex.name + ':', data.errors);
      return [];
    }

    const pools0: RawPool[] = data.data?.pools0 || [];
    const pools1: RawPool[] = data.data?.pools1 || [];
    const allPools = [...pools0, ...pools1];

    const seenIds = new Set<string>();
    const uniquePools = allPools.filter(pool => {
      if (seenIds.has(pool.id)) return false;
      seenIds.add(pool.id);
      return true;
    });

    for (const pool of uniquePools) {
      const decimals0 = Number(pool.token0.decimals);
      const decimals1 = Number(pool.token1.decimals);
      const tick = Number(pool.tick);
      const feeTier = Number(pool.feeTier);
      
      const currentPrice = sqrtPriceToPrice(pool.sqrtPrice, decimals0, decimals1);
      const tickSpacing = feeTier === 100 ? 1 : feeTier === 500 ? 10 : feeTier === 3000 ? 60 : 200;
      const tickLower = Math.floor(tick / tickSpacing) * tickSpacing - tickSpacing * 10;
      const tickUpper = Math.ceil(tick / tickSpacing) * tickSpacing + tickSpacing * 10;
      
      const priceLower = tickToPrice(tickLower, decimals0, decimals1);
      const priceUpper = tickToPrice(tickUpper, decimals0, decimals1);

      results.push({
        platform: dex.name,
        chain: dex.chain,
        pair: pool.token0.symbol + '/' + pool.token1.symbol,
        feeTier: formatFeeTier(feeTier),
        priceRange: formatPrice(priceLower) + ' - ' + formatPrice(priceUpper),
        currentPrice: formatPrice(currentPrice),
        tvlUSD: formatUSD(pool.totalValueLockedUSD),
        volume24hUSD: formatUSD(pool.volumeUSD),
        priceLower,
        priceUpper,
        currentPriceNum: currentPrice,
      });
    }
  } catch (error) {
    console.error('Error querying ' + dex.name + ':', error);
  }

  return results;
}

export async function searchPools(
  tokenAddress: string,
  selectedChains: ChainId[] = ['bsc', 'ethereum', 'base']
): Promise<PoolResult[]> {
  const dexsToQuery = DEX_LIST.filter(dex => selectedChains.includes(dex.chain));
  const promises = dexsToQuery.map(dex => querySubgraph(dex, tokenAddress));
  const results = await Promise.all(promises);
  
  const allResults = results.flat();
  allResults.sort((a, b) => {
    const tvlA = parseFloat(a.tvlUSD.replace(/[\$,KM]/g, '')) * (a.tvlUSD.includes('M') ? 1000000 : a.tvlUSD.includes('K') ? 1000 : 1);
    const tvlB = parseFloat(b.tvlUSD.replace(/[\$,KM]/g, '')) * (b.tvlUSD.includes('M') ? 1000000 : b.tvlUSD.includes('K') ? 1000 : 1);
    return tvlB - tvlA;
  });
  
  return allResults.slice(0, 10);
}
