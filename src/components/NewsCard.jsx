import React from 'react';
import { FaRegNewspaper } from 'react-icons/fa';
import { MESSAGES } from '../constants/messages';


const NewsCard = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800 shadow-2xl rounded-2xl p-6 sm:p-8 w-full border border-gray-700 animate-fade-in-up transform transition-all duration-300">
        <h3 className="text-3xl font-extrabold text-center text-gray-200 border-b-2 pb-4 border-gray-700">
          Recent News
        </h3>
        <p className="text-center text-gray-400 mt-6">No recent news available.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 shadow-2xl rounded-2xl p-6 sm:p-8 w-full border border-gray-700 animate-fade-in-up transform transition-all duration-300">
      <h3 className="text-3xl font-extrabold text-center text-gray-200 border-b-2 pb-4 border-gray-700">
        Recent News
      </h3>
      <ul className="mt-6 space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        {data.slice(0, 8).map((article, index) => (
          <li key={index} className="bg-gray-700 p-4 rounded-lg shadow-md border border-gray-600">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-400 hover:text-blue-300 hover:underline text-lg font-bold leading-tight"
            >
              {article.title}
            </a>
            {article.publishedDate && (
              <p className="text-gray-400 text-sm mt-1">
                Published: {new Date(article.publishedDate).toLocaleDateString()}
              </p>
            )}
            {article.error && <p className="text-red-500 text-xs mt-1">{article.error}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NewsCard;