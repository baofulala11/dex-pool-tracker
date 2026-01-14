import { PoolResult, ChainId } from '@/types';
import { CHAINS } from '@/lib/chains';

interface Props {
  pool: PoolResult;
  index: number;
}

const getChainBadgeColor = (chain: ChainId) => {
  switch (chain) {
    case 'bsc': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'ethereum': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'base': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

export default function PoolCard({ pool, index }: Props) {
  return (
    <div className="bg-[#111]/80 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex flex-wrap justify-between items-center bg-gray-900/30">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold">{pool.pair}</span>
          <span className={`px-2 py-1 rounded text-xs border ${getChainBadgeColor(pool.chain)}`}>{CHAINS[pool.chain].name}</span>
          <span className="text-gray-400 text-sm">{pool.platform} ({pool.feeTier})</span>
        </div>
        <div className="flex gap-4 text-sm mt-2 sm:mt-0">
          <div><span className="text-gray-500">Price: </span><span className="text-green-400 font-mono">{pool.currentPrice}</span></div>
          <div><span className="text-gray-500">TVL: </span><span className="text-blue-400 font-bold">{pool.tvlUSD}</span></div>
          <div><span className="text-gray-500">Vol 24h: </span><span className="text-purple-400">{pool.volume24hUSD}</span></div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Top 10 LP Positions</h4>
          <span className="text-xs text-gray-600 bg-gray-800/50 px-2 py-1 rounded">Real-time On-chain Data</span>
        </div>
        
        {pool.positions && pool.positions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800/50">
                  <th className="pb-2 pl-2">Rank</th>
                  <th className="pb-2">Price Range</th>
                  <th className="pb-2">Liquidity (Est. USD)</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {pool.positions.map((pos, pIdx) => (
                  <tr key={pIdx} className="border-b border-gray-800/30 hover:bg-gray-800/20 transition-colors">
                    <td className="py-3 pl-2 text-gray-400">#{pos.rank}</td>
                    <td className="py-3 font-mono text-gray-300">
                      <div className="flex items-center gap-2">
                        <span className="text-orange-400">{pos.priceLower}</span>
                        <span className="text-gray-600">-</span>
                        <span className="text-orange-400">{pos.priceUpper}</span>
                      </div>
                    </td>
                    <td className="py-3 text-blue-400 font-medium">{pos.liquidityUSD}</td>
                    <td className="py-3">
                      {pos.isInRange ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900/30 text-green-400 border border-green-900/50">Active</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900/30 text-red-400 border border-red-900/50">Inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-gray-800 rounded-xl bg-gray-900/20">
            <p className="text-gray-500 text-sm">No active positions found or data unavailable.</p>
            <p className="text-xs text-gray-600 mt-1">Make sure this is a V3 pool and the API Key is valid.</p>
          </div>
        )}
      </div>
    </div>
  );
}
