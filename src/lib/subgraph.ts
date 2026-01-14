import { DEX, PoolResult, PositionResult, ChainId } from '@/types';
import { DEX_LIST } from './chains';

// GraphQL Queries
const POOLS_QUERY = `
  query GetPools($token: String!) {
    pools0: pools(
      first: 2
      orderBy: totalValueLockedUSD
      orderDirection: desc
      where: { token0: $token }
    ) {
      id
      token0 { id symbol decimals }
      token1 { id symbol decimals }
      feeTier
      sqrtPrice
      tick
      liquidity
      totalValueLockedUSD
      volumeUSD
    }
    pools1: pools(
      first: 2
      orderBy: totalValueLockedUSD
      orderDirection: desc
      where: { token1: $token }
    ) {
      id
      token0 { id symbol decimals }
      token1 { id symbol decimals }
      feeTier
      sqrtPrice
      tick
      liquidity
      totalValueLockedUSD
      volumeUSD
    }
  }
`;

const POSITIONS_QUERY = `
  query GetPositions($poolId: String!) {
    positions(
      first: 10
      orderBy: liquidity
      orderDirection: desc
      where: { pool: $poolId, liquidity_gt: "0" }
    ) {
      id
      owner
      liquidity
      tickLower { tickIdx }
      tickUpper { tickIdx }
    }
  }
`;

function tickToPrice(tick: number, decimalsA: number, decimalsB: number, invert: boolean = false): number {
  let price = Math.pow(1.0001, tick) * Math.pow(10, decimalsA - decimalsB);
  if (invert && price !== 0) price = 1 / price;
  return price;
}

function formatUSD(val: string | number): string {
  const num = Number(val);
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

function formatPrice(price: number): string {
  if (price === 0) return '0';
  if (price < 0.000001) return price.toExponential(4);
  if (price < 1) return price.toFixed(6);
  if (price > 1000) return price.toFixed(2);
  return price.toFixed(4);
}

function estimateLiquidityUSD(
  positionLiquidity: string,
  poolLiquidity: string,
  poolTVL: string
): string {
  const posL = parseFloat(positionLiquidity);
  const poolL = parseFloat(poolLiquidity);
  const tvl = parseFloat(poolTVL);
  
  if (poolL === 0) return '$0';
  const val = (posL / poolL) * tvl;
  return formatUSD(val);
}

async function querySubgraph(
  dex: DEX, 
  tokenAddress: string, 
  apiKey: string
): Promise<PoolResult[]> {
  const endpoint = apiKey 
    ? `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/${dex.subgraphId}`
    : dex.subgraphId.startsWith('http') ? dex.subgraphId : '';

  if (!endpoint) return [];

  try {
    console.log(`Querying ${dex.name} at ${endpoint} for ${tokenAddress}`);
    
    // 1. Get Pools
    const poolsRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: POOLS_QUERY,
        variables: { token: tokenAddress.toLowerCase() }
      })
    });
    
    const poolsData = await poolsRes.json();
    if (poolsData.errors) {
      console.error(`Error fetching pools from ${dex.name}:`, poolsData.errors);
      return [];
    }

    const pools0 = poolsData.data?.pools0 || [];
    const pools1 = poolsData.data?.pools1 || [];
    const allPools = [...pools0, ...pools1];

    console.log(`Found ${allPools.length} pools for ${dex.name}`);

    const results: PoolResult[] = [];

    // Process each pool
    for (const pool of allPools) {
      const isToken0 = pool.token0.id.toLowerCase() === tokenAddress.toLowerCase();
      const baseToken = isToken0 ? pool.token0 : pool.token1;
      const quoteToken = isToken0 ? pool.token1 : pool.token0;
      
      const currentTick = Number(pool.tick);
      const invertPrice = !isToken0; 
      const currentPriceNum = tickToPrice(currentTick, Number(pool.token0.decimals), Number(pool.token1.decimals), invertPrice);

      // 2. Get Positions
      let positions: PositionResult[] = [];
      try {
        const posRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: POSITIONS_QUERY,
            variables: { poolId: pool.id }
          })
        });
        
        const posData = await posRes.json();
        
        if (posData.errors) {
          console.warn(`Positions query error for pool ${pool.id}:`, posData.errors);
        } else if (posData.data?.positions) {
          positions = posData.data.positions.map((pos: any, idx: number) => {
            const tickLower = Number(pos.tickLower.tickIdx);
            const tickUpper = Number(pos.tickUpper.tickIdx);
            
            let priceLower = tickToPrice(tickLower, Number(pool.token0.decimals), Number(pool.token1.decimals), invertPrice);
            let priceUpper = tickToPrice(tickUpper, Number(pool.token0.decimals), Number(pool.token1.decimals), invertPrice);
            
            if (invertPrice) {
              [priceLower, priceUpper] = [priceUpper, priceLower];
            }

            const inRange = currentTick >= tickLower && currentTick < tickUpper;

            return {
              rank: idx + 1,
              id: pos.id,
              owner: pos.owner || 'Unknown',
              liquidityUSD: estimateLiquidityUSD(pos.liquidity, pool.liquidity, pool.totalValueLockedUSD),
              priceLower: formatPrice(priceLower),
              priceUpper: formatPrice(priceUpper),
              isInRange: inRange,
              platform: dex.name,
              chain: dex.chain,
              pair: `${baseToken.symbol}/${quoteToken.symbol}`,
              feeTier: (Number(pool.feeTier) / 10000).toFixed(2) + '%'
            };
          });
        }
      } catch (err) {
        console.warn(`Failed to fetch positions for pool ${pool.id}`, err);
      }

      results.push({
        platform: dex.name,
        chain: dex.chain,
        pair: `${baseToken.symbol}/${quoteToken.symbol}`,
        feeTier: (Number(pool.feeTier) / 10000).toFixed(2) + '%',
        tvlUSD: formatUSD(pool.totalValueLockedUSD),
        volume24hUSD: formatUSD(pool.volumeUSD),
        currentPrice: formatPrice(currentPriceNum),
        priceRange: positions.length > 0 ? `${positions.length} active positions` : "No positions found",
        priceLower: 0, 
        priceUpper: 0,
        currentPriceNum,
        positions: positions
      });
    }

    return results;

  } catch (error) {
    console.error(`Query failed for ${dex.name}`, error);
    return [];
  }
}

export async function searchPools(
  tokenAddress: string,
  apiKey: string,
  selectedChains: ChainId[] = ['bsc', 'ethereum', 'base']
): Promise<PoolResult[]> {
  if (!apiKey) {
    return [];
  }

  const activeDexs = DEX_LIST.filter(d => selectedChains.includes(d.chain));
  
  const promises = activeDexs.map(dex => querySubgraph(dex, tokenAddress, apiKey));
  const results = await Promise.all(promises);
  
  return results.flat().sort((a, b) => {
    const getVal = (s: string) => {
      if (s.includes('M')) return parseFloat(s) * 1e6;
      if (s.includes('K')) return parseFloat(s) * 1e3;
      return parseFloat(s.replace('$',''));
    };
    return getVal(b.tvlUSD) - getVal(a.tvlUSD);
  });
}
