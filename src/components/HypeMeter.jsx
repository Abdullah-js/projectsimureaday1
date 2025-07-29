import React from 'react';
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';

const HypeMeter = ({ score }) => {
  const normalizedScore = (score + 1) * 50;

  let meterColorClass = 'bg-yellow-500'; // Neutral
  if (score >= 0.05) {
    meterColorClass = 'bg-green-500'; // Positive
  } else if (score <= -0.05) {
    meterColorClass = 'bg-red-500'; // Negative
  }

  return (
    <div className="w-full my-4">
      <div className="flex justify-between mb-1 text-sm font-medium text-gray-500 px-1">
        <span>Bearish</span>
        <span>Neutral</span>
        <span>Bullish</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-6 shadow-inner overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${meterColorClass}`}
          style={{ width: `${normalizedScore}%` }}
        ></div>
      </div>
    </div>
  );
};

export default HypeMeter;