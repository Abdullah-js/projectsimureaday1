import React from 'react';
import { FaDollarSign, FaChartBar, FaBuilding } from 'react-icons/fa';

const FinancialDataCard = ({ data, symbol }) => {
  if (!data) return null;

  const formatMarketCap = (cap) => {
    if (!cap) return 'N/A';
    if (cap >= 1_000_000_000_000) return `$${(cap / 1_000_000_000_000).toFixed(2)}T`;
    if (cap >= 1_000_000_000) return `$${(cap / 1_000_000_000).toFixed(2)}B`;
    if (cap >= 1_000_000) return `$${(cap / 1_000_000).toFixed(2)}M`;
    return `$${cap.toLocaleString()}`;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-yellow-400';
  };

  return (
    <div className="bg-gray-800 shadow-2xl rounded-2xl p-6 sm:p-8 w-full border border-gray-700 animate-fade-in-up transform transition-all duration-300">
      <h3 className="text-3xl font-extrabold text-center text-gray-200 border-b-2 pb-4 border-gray-700">
        Financials for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">{symbol}</span>
      </h3>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between text-lg">
          <span className="flex items-center text-gray-400"><FaDollarSign className="mr-3 text-blue-400 text-xl" />Current Price:</span>
          <span className="font-bold text-white text-2xl">${data.price?.toFixed(2) || 'N/A'}</span>
        </div>

        <div className="flex items-center justify-between text-lg">
          <span className="flex items-center text-gray-400"><FaChartBar className="mr-3 text-blue-400 text-xl" />Change (%):</span>
          <span className={`font-bold text-2xl ${getChangeColor(data.changesPercentage)}`}>
            {data.changesPercentage?.toFixed(2) || 'N/A'}%
          </span>
        </div>

        <div className="flex items-center justify-between text-lg">
          <span className="flex items-center text-gray-400"><FaBuilding className="mr-3 text-blue-400 text-xl" />Market Cap:</span>
          <span className="font-bold text-white text-xl">{formatMarketCap(data.marketCap)}</span>
        </div>

        <div className="flex items-center justify-between text-lg">
          <span className="flex items-center text-gray-400">P/E Ratio:</span>
          <span className="font-bold text-white text-xl">{data.peRatio?.toFixed(2) || 'N/A'}</span>
        </div>

        <div className="text-sm text-gray-500 text-right pt-4 border-t border-gray-700">
          Source: {data.source || 'Financial Modeling Prep'}
        </div>
      </div>
    </div>
  );
};

export default FinancialDataCard;