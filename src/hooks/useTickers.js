import { useCallback, useMemo } from 'react';
import useApiFetch from './useApiFetch';
import { API_BASE_URL } from '../constants/api'; 

const useTickers = () => {
  const apiUrl = useMemo(() => `${API_BASE_URL}/tickers`, []);
  const { data, loading, error, fetchData } = useApiFetch(apiUrl);

  const tickerOptions = useMemo(() => {
    if (data && Array.isArray(data)) {
      return data.map(stock => ({
        value: stock.symbol,
        label: `${stock.symbol} - ${stock.name}`,
        name: stock.name,
      }));
    }
    return [];
  }, [data]);

  const refetchTickers = useCallback(() => fetchData(apiUrl), [fetchData, apiUrl]);

  return {
    tickerOptions,
    isTickersLoading: loading,
    tickerError: error,
    refetchTickers,
    hasTickers: tickerOptions.length > 0
  };
};

export default useTickers