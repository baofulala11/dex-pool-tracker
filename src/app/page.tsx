'use client';

import { useState } from 'react';
import { searchPools } from '@/lib/subgraph';
import { PoolResult, ChainId } from '@/types';
import PoolCard from '@/components/PoolCard';
import SearchForm from '@/components/SearchForm';

export default function Home() {
  const [results, setResults] = useState<PoolResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (tokenAddress: string, apiKey: string, selectedChains: ChainId[]) => {
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const pools = await searchPools(tokenAddress.trim(), apiKey.trim(), selectedChains);
      setResults(pools);
      if (pools.length === 0) {
        setError('No liquidity pools found. Please check the Token Address and API Key.');
      }
    } catch (err) {
      setError('Search failed. Please check console for details.');
      console.error(err);
    } finally {
      setLoading(false);
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
          <p className="text-gray-400 text-lg">Query LP Positions from The Graph Network</p>
        </div>
        
        <SearchForm onSearch={handleSearch} loading={loading} error={error} />

        {results.length > 0 && (
          <div className="space-y-6">
            {results.map((pool, index) => (
              <PoolCard key={index} pool={pool} index={index} />
            ))}
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
