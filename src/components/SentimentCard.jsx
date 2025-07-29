/ src/components/SentimentCard.jsx
import React from 'react';
import { FaChartLine, FaRedditAlien, FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';
import HypeMeter from './HypeMeter'; 

const SentimentCard = ({ data }) => {
  if (!data || !data.sentiment) {
    return null;
  }

  const { symbol, sentiment } = data;

  const getSentimentStyling = (category) => {
    switch (category?.toLowerCase()) {
      case 'positive':
        return { color: 'text-green-400', icon: <FaArrowUp className="mr-2" /> };
      case 'negative':
        return { color: 'text-red-400', icon: <FaArrowDown className="mr-2" /> };
      default:
        return { color: 'text-yellow-400', icon: <FaMinus className="mr-2" /> };
    }
  };

  const { color, icon } = getSentimentStyling(sentiment.category);

  return (
    <div className="bg-gray-800 shadow-2xl rounded-2xl p-6 sm:p-8 w-full border border-gray-700 animate-fade-in-up transform transition-all duration-300">
      <h2 className="text-3xl font-extrabold text-center text-gray-200 border-b-2 pb-4 border-gray-700">
        Analysis for <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{symbol}</span>
      </h2>

      <section className="mt-6">
        <h3 className="text-xl font-bold text-gray-300 mb-2 flex items-center">
          <FaChartLine className="mr-3 text-purple-400" /> Social Hype Meter
        </h3>
        <HypeMeter score={sentiment.score} />
      </section>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col items-center justify-center bg-gray-700 p-5 rounded-xl shadow-inner border border-gray-600">
          <p className="text-md text-gray-400 font-medium mb-1">Overall Sentiment</p>
          <p className={`text-3xl font-bold ${color} flex items-center`}>
            {icon}
            {sentiment.category?.toUpperCase() ?? 'UNKNOWN'}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center bg-gray-700 p-5 rounded-xl shadow-inner border border-gray-600">
          <p className="text-md text-gray-400 font-medium mb-1">Sentiment Score</p>
          <p className={`text-4xl font-bold ${color}`}>
            {sentiment.score?.toFixed(3) ?? 'N/A'}
          </p>
        </div>
      </section>

      <section className="mt-8 border-t-2 pt-6 border-gray-700">
        <div className="flex items-center justify-center text-lg text-gray-400">
          <FaRedditAlien className="text-orange-500 mr-3 text-2xl" />
          <span className="font-medium mr-2">Reddit Mentions Analyzed:</span>
          <span className="font-bold text-purple-400">{sentiment.total_posts_analyzed || 0}</span>
        </div>
      </section>
    </div>
  );
};

export default SentimentCard;