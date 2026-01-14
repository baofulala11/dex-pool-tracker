'use client';

import { useState } from 'react';
import { searchPools } from '@/lib/subgraph';
import { PoolResult, ChainId } from '@/types';
import { CHAINS } from '@/lib/chains';

export default function Home() {
  const [tokenAddress, setTokenAddress] = useState('');
  const [selectedChains, setSelectedChains] = useState<ChainId[]>(['bsc', 'ethereum', 'base']);
  const [results, setResults] = useState<PoolResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!tokenAddress.trim()) {
      setError('Please enter a token contract address');
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress.trim())) {
      setError('Invalid contract address format');
      return;
    }
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const pools = await searchPools(tokenAddress.trim(), selectedChains);
      setResults(pools);
      if (pools.length === 0) {
        setError('No liquidity pools found for this token');
      }
    } catch (err) {
      setError('Error searching pools. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleChain = (chain: ChainId) => {
    setSelectedChains(prev =>
      prev.includes(chain) ? prev.filter(c => c !== chain) : [...prev, chain]
    );
  };

  const getChainBadgeColor = (chain: ChainId) => {
    switch (chain) {
      case 'bsc': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'ethereum': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'base': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10" style={{ backgroundImage: "url('/background.png')" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/50 to-[#0a0a0a]" />
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/logo.png" alt="Logo" className="w-16 h-16" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-yellow-500 bg-clip-text text-transparent">DEX Pool Tracker</h1>
          </div>
          <p className="text-gray-400 text-lg">Query liquidity pools across multiple DEXs and chains</p>
        </div>
        <div className="bg-[#111]/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 mb-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Select Chains</label>
            <div className="flex flex-wrap gap-3">
              {Object.entries(CHAINS).map(([key, chain]) => (
                <button key={key} onClick={() => toggleChain(key as ChainId)} className={'px-4 py-2 rounded-lg border transition-all ' + (selectedChains.includes(key as ChainId) ? getChainBadgeColor(key as ChainId) : 'bg-gray-800/50 text-gray-500 border-gray-700')}>{chain.name}</button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Token Contract Address</label>
            <input type="text" value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} placeholder="0x..." className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors font-mono text-sm" />
          </div>
          <button onClick={handleSearch} disabled={loading || selectedChains.length === 0} className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold rounded-xl hover:from-orange-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {loading ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Searching...</span> : 'Search Pools'}
          </button>
          {error && <p className="mt-4 text-center text-red-400">{error}</p>}
        </div>
        {results.length > 0 && (
          <div className="bg-[#111]/80 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-800"><h2 className="text-xl font-semibold">Top {results.length} Liquidity Pools</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm border-b border-gray-800">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Platform</th>
                    <th className="px-4 py-3">Chain</th>
                    <th className="px-4 py-3">Pair</th>
                    <th className="px-4 py-3">Fee</th>
                    <th className="px-4 py-3">Price Range</th>
                    <th className="px-4 py-3">Current Price</th>
                    <th className="px-4 py-3">TVL</th>
                    <th className="px-4 py-3">Volume 24h</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((pool, index) => (
                    <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-4 text-gray-500">{index + 1}</td>
                      <td className="px-4 py-4 font-medium text-orange-400">{pool.platform}</td>
                      <td className="px-4 py-4"><span className={'px-2 py-1 rounded text-xs border ' + getChainBadgeColor(pool.chain)}>{CHAINS[pool.chain].name}</span></td>
                      <td className="px-4 py-4 font-medium">{pool.pair}</td>
                      <td className="px-4 py-4 text-gray-300">{pool.feeTier}</td>
                      <td className="px-4 py-4 text-gray-300 font-mono text-sm">{pool.priceRange}</td>
                      <td className="px-4 py-4 text-green-400 font-mono">{pool.currentPrice}</td>
                      <td className="px-4 py-4 text-blue-400 font-semibold">{pool.tvlUSD}</td>
                      <td className="px-4 py-4 text-purple-400">{pool.volume24hUSD}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Powered by The Graph Protocol</p>
          <p className="mt-1">BSC | Ethereum | Base</p>
        </footer>
      </div>
    </main>
  );
}
