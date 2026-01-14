import { useState } from 'react';
import { ChainId } from '@/types';
import { CHAINS } from '@/lib/chains';

interface Props {
  onSearch: (token: string, key: string, chains: ChainId[]) => void;
  loading: boolean;
  error: string;
}

export default function SearchForm({ onSearch, loading, error }: Props) {
  const [tokenAddress, setTokenAddress] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [selectedChains, setSelectedChains] = useState<ChainId[]>(['bsc', 'ethereum', 'base']);

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
    <div className="bg-[#111]/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 mb-8">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">The Graph API Key</label>
        <input 
          type="password" 
          value={apiKey} 
          onChange={(e) => setApiKey(e.target.value)} 
          placeholder="Enter your API Key" 
          className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors font-mono text-sm" 
        />
        <p className="text-xs text-gray-500 mt-1">Required for querying The Graph Gateway</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">Select Chains</label>
        <div className="flex flex-wrap gap-3">
          {Object.entries(CHAINS).map(([key, chain]) => (
            <button 
              key={key} 
              onClick={() => toggleChain(key as ChainId)} 
              className={`px-4 py-2 rounded-lg border transition-all ${selectedChains.includes(key as ChainId) ? getChainBadgeColor(key as ChainId) : 'bg-gray-800/50 text-gray-500 border-gray-700'}`}
            >
              {chain.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Token Contract Address</label>
        <input 
          type="text" 
          value={tokenAddress} 
          onChange={(e) => setTokenAddress(e.target.value)} 
          placeholder="0x..." 
          className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors font-mono text-sm" 
        />
      </div>
      
      <button 
        onClick={() => onSearch(tokenAddress, apiKey, selectedChains)} 
        disabled={loading || selectedChains.length === 0} 
        className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold rounded-xl hover:from-orange-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Scanning Chain...
          </span>
        ) : (
          'Search Pools & Positions'
        )}
      </button>
      
      {error && <p className="mt-4 text-center text-red-400 bg-red-900/20 py-2 rounded border border-red-900/50">{error}</p>}
    </div>
  );
}
