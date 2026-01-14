import { PoolResult, ChainId } from '@/types';

const CHAIN_MAP: Record<string, ChainId> = {
  'bsc': 'bsc',
  'ethereum': 'ethereum',
  'base': 'base',
  'eth': 'ethereum',
};

function formatUSD(value: number): string {
  if (value >= 1000000) return '$' + (value / 1000000).toFixed(2) + 'M';
  if (value >= 1000) return '$' + (value / 1000).toFixed(2) + 'K';
  return '$' + value.toFixed(2);
}

function formatPrice(price: number): string {
  if (price >= 1000) return '$' + price.toFixed(2);
  if (price >= 1) return '$' + price.toFixed(4);
  if (price >= 0.0001) return '$' + price.toFixed(6);
  if (price >= 0.00000001) return '$' + price.toFixed(10);
  return '$' + price.toExponential(4);
}

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  labels?: string[];
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceNative: string;
  priceUsd: string;
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  fdv?: number;
}

export async function searchPools(
  tokenAddress: string,
  selectedChains: ChainId[] = ['bsc', 'ethereum', 'base']
): Promise<PoolResult[]> {
  const results: PoolResult[] = [];
  const normalizedAddress = tokenAddress.toLowerCase();

  try {
    const response = await fetch(
      'https://api.dexscreener.com/latest/dex/tokens/' + normalizedAddress
    );
    
    if (!response.ok) {
      console.error('DexScreener API error:', response.status);
      return [];
    }

    const data = await response.json();
    const pairs: DexScreenerPair[] = data.pairs || [];

    for (const pair of pairs) {
      const chainId = CHAIN_MAP[pair.chainId];
      if (!chainId || !selectedChains.includes(chainId)) continue;

      const liquidity = pair.liquidity?.usd || 0;
      const volume24h = pair.volume?.h24 || 0;
      const currentPrice = parseFloat(pair.priceUsd) || 0;

      // Determine fee tier from labels
      let feeTier = '0.30%';
      if (pair.labels?.includes('v3')) {
        feeTier = '0.25%';
      } else if (pair.labels?.includes('v2')) {
        feeTier = '0.25%';
      }

      // Estimate price range (for V3 pools this is approximate)
      const priceLower = currentPrice * 0.8;
      const priceUpper = currentPrice * 1.2;

      results.push({
        platform: pair.dexId.charAt(0).toUpperCase() + pair.dexId.slice(1),
        chain: chainId,
        pair: pair.baseToken.symbol + '/' + pair.quoteToken.symbol,
        feeTier: feeTier,
        priceRange: formatPrice(priceLower) + ' - ' + formatPrice(priceUpper),
        currentPrice: formatPrice(currentPrice),
        tvlUSD: formatUSD(liquidity),
        volume24hUSD: formatUSD(volume24h),
        priceLower,
        priceUpper,
        currentPriceNum: currentPrice,
      });
    }

    // Sort by TVL descending
    results.sort((a, b) => {
      const tvlA = parseFloat(a.tvlUSD.replace(/[\$,KM]/g, '')) * (a.tvlUSD.includes('M') ? 1000000 : a.tvlUSD.includes('K') ? 1000 : 1);
      const tvlB = parseFloat(b.tvlUSD.replace(/[\$,KM]/g, '')) * (b.tvlUSD.includes('M') ? 1000000 : b.tvlUSD.includes('K') ? 1000 : 1);
      return tvlB - tvlA;
    });

  } catch (error) {
    console.error('Error querying DexScreener:', error);
  }

  return results.slice(0, 10);
}
