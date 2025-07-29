import React, { useState } from 'react';
import Select from 'react-select';
import { FaInfoCircle, FaSearch, FaRedo } from 'react-icons/fa';

import useTickers from './hooks/useTickers';
import useAnalysis from './hooks/useAnalysis';

import { MESSAGES } from './constants/messages';

import SentimentCard from './components/SentimentCard';
import FinancialDataCard from './components/FinancialDataCard';
import NewsCard from './components/NewsCard';

function App() {
  const [selectedStock, setSelectedStock] = useState(null);

  const { tickerOptions, isTickersLoading, tickerError, refetchTickers, hasTickers } = useTickers();
  const { analysisData, isAnalysisLoading, analysisError, refetchAnalysis } = useAnalysis(
    selectedStock?.value,
    selectedStock?.name
  );

  const handleStockChange = (selectedOption) => {
    setSelectedStock(selectedOption);
    if (!selectedOption) {
    }
  };

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '52px',
      borderRadius: '0.75rem',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(167, 139, 250, 0.3)' : '0 1px 3px 0 rgba(0, 0, 0, 0.07)',
      border: state.isFocused ? '2px solid #a78bfa' : '2px solid #4b5563',
      transition: 'all 0.2s ease-in-out',
      '&:hover': { borderColor: '#c4b5fd' },
      backgroundColor: '#1f2937',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#8b5cf6' : state.isFocused ? '#374151' : '#1f2937',
      color: state.isSelected ? 'white' : state.isFocused ? 'white' : '#d1d5db',
      padding: '12px 16px',
      fontSize: '1rem',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#d1d5db',
    }),
    input: (provided) => ({
      ...provided,
      color: '#d1d5db',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: '#1f2937',
      borderColor: '#4b5563',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    }),
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-8 font-inter">
      <header className="text-center my-10 animate-fade-in-up">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 tracking-tight">
          {MESSAGES.APP_TITLE}
        </h1>
        <p className="text-lg text-gray-400 mt-2">{MESSAGES.APP_DESCRIPTION}</p>
        <div className="mt-4 inline-block animate-skull-bounce">
          <span role="img" aria-label="skull" className="text-6xl">💀</span>
        </div>
      </header>

      <main className="w-full max-w-xl z-10 mb-8">
        <Select
          options={tickerOptions}
          onChange={handleStockChange}
          value={selectedStock}
          isLoading={isTickersLoading}
          isClearable
          isSearchable
          placeholder={
            tickerError
              ? MESSAGES.PLACEHOLDER_FAILED_TICKERS
              : isTickersLoading
              ? MESSAGES.PLACEHOLDER_LOADING_TICKERS
              : MESSAGES.PLACEHOLDER_SEARCH_STOCK
          }
          styles={customSelectStyles}
          aria-label="Search for a stock"
          components={{ DropdownIndicator: () => <FaSearch className="mr-3 text-gray-400" />, IndicatorSeparator: () => null }}
          isDisabled={isTickersLoading && !tickerError && !hasTickers} // Disable if loading and no tickers loaded yet
        />
        {tickerError && (
          <div className="bg-red-800 border-l-4 border-red-500 text-red-100 p-3 rounded-lg shadow-lg mt-4 animate-fade-in-up flex items-center justify-between" role="alert">
            <div>
              <p className="font-bold flex items-center text-md"><FaInfoCircle className="mr-2" />{MESSAGES.ERROR_LOADING_TICKERS_TITLE}</p>
              <p className="mt-1 text-sm">{tickerError}</p>
            </div>
            <button
              onClick={refetchTickers}
              className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 rounded-md text-white text-sm font-semibold flex items-center"
              aria-label={MESSAGES.RETRY_BUTTON + " loading tickers"}
            >
              <FaRedo className="mr-2" /> {MESSAGES.RETRY_BUTTON}
            </button>
          </div>
        )}
        {!isTickersLoading && !tickerError && !hasTickers && ( // ✅ UI for no tickers found
             <div className="bg-yellow-800 border-l-4 border-yellow-500 text-yellow-100 p-3 rounded-lg shadow-lg mt-4 animate-fade-in-up flex items-center" role="status">
                <FaInfoCircle className="mr-2" />
                <p className="text-sm">No stock tickers found. The API might be empty or unavailable.</p>
             </div>
        )}
      </main>

      <div className="w-full max-w-4xl">
        {analysisError && (
          <div className="bg-red-800 border-l-4 border-red-500 text-red-100 p-4 rounded-lg shadow-lg mb-8 animate-fade-in-up" role="alert">
            <p className="font-bold flex items-center text-lg"><FaInfoCircle className="mr-3" />{MESSAGES.ANALYSIS_ERROR_TITLE}</p>
            <p className="mt-2 text-sm">{analysisError}</p>
          </div>
        )}

        {isAnalysisLoading && (
          <div className="text-center p-8 bg-gray-800 rounded-xl shadow-lg mb-8 animate-fade-in-up">
            <svg className="animate-spin h-12 w-12 text-purple-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xl text-purple-400 mt-4 font-semibold animate-pulse">{MESSAGES.ANALYSIS_LOADING}</p>
          </div>
        )}

        {!isAnalysisLoading && !analysisError && !analysisData && !selectedStock && (
          <div className="bg-gray-800 p-8 rounded-2xl shadow-xl text-center border border-gray-700 mt-4 animate-fade-in-up">
            <p className="text-2xl font-bold text-gray-200">{MESSAGES.WELCOME_TITLE}</p>
            <p className="text-lg text-gray-400 mt-2">
              {MESSAGES.WELCOME_MESSAGE}
            </p>
          </div>
        )}
        {}
        {}
        {!isAnalysisLoading && !analysisError && !analysisData && selectedStock && (
             <div className="bg-gray-800 p-8 rounded-2xl shadow-xl text-center border border-gray-700 mt-4 animate-fade-in-up">
                <p className="text-2xl font-bold text-gray-200">No Analysis Found</p>
                <p className="text-lg text-gray-400 mt-2">
                    Could not retrieve analysis for "{selectedStock.label}". It might not be available or there was an issue.
                </p>
                <button
                    onClick={refetchAnalysis}
                    className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-semibold flex items-center mx-auto"
                    aria-label={MESSAGES.RETRY_BUTTON + " analysis"}
                >
                    <FaRedo className="mr-2" /> {MESSAGES.RETRY_BUTTON} Analysis
                </button>
             </div>
        )}

        {!isAnalysisLoading && analysisData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <SentimentCard data={analysisData} />
            <FinancialDataCard data={analysisData.financial_data} symbol={analysisData.symbol} />
            <div className="lg:col-span-2">
              <NewsCard data={analysisData.recent_news} />
            </div>
          </div>
        )}
      </div>

      <footer className="text-center text-gray-500 mt-12 text-sm">
        <p>{MESSAGES.FOOTER_TEXT}</p>
      </footer>
    </div>
  );
}

export default App;