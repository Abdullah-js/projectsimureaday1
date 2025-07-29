/ src/hooks/useAnalysis.js
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import useApiFetch from './useApiFetch';
import { API_BASE_URL } from '../constants/api';

const useAnalysis = (symbol, name) => {
  const [analysisData, setAnalysisData] = useState(null);
  const symbolRef = useRef(symbol); 
  useEffect(() => {
    symbolRef.current = symbol;
  }, [symbol]);

  const fetchUrl = useMemo(() => {
    if (!symbol) return null;
    const params = new URLSearchParams({ symbol, name: name || '' });
    return `${API_BASE_URL}/analyze?${params.toString()}`;
  }, [symbol, name]);

  const { data, loading, error, fetchData } = useApiFetch(fetchUrl);

  useEffect(() => {
    if (data) {
      if (data.symbol === symbolRef.current) {
        setAnalysisData(data);
      } else {
        console.warn(`Ignoring stale analysis data for ${data.symbol}, current symbol is ${symbolRef.current}`);
      }
    } else if (error) {
      setAnalysisData(null);
    } else if (!loading && !data && !error && symbol) {
      
      setAnalysisData(null);
    }
  }, [data, error, loading, symbol]); 

  const refetchAnalysis = useCallback(() => {
    if (fetchUrl) {
      fetchData(fetchUrl); 
    }
  }, [fetchUrl, fetchData]);

  return {
    analysisData,
    isAnalysisLoading: loading,
    analysisError: error,
    refetchAnalysis
  };
};

export default useAnalysis;