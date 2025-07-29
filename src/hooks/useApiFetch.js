/ src/hooks/useApiFetch.js
import { useState, useEffect, useCallback, useRef } from 'react';

const useApiFetch = (initialUrl = null, initialOptions = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [url, setUrl] = useState(initialUrl);
  const [options, setOptions] = useState(initialOptions);

  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async (newUrl, newOptions) => {
    if (newUrl) setUrl(newUrl);
    if (newOptions) setOptions(prev => ({ ...prev, ...newOptions }));

    const currentUrl = newUrl || url;
    const currentOptions = newOptions ? { ...options, ...newOptions } : options;

    if (!currentUrl) {
      setError("No URL provided for fetching.");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(currentUrl, { ...currentOptions, signal });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        const status = res.status;
        let errorMessage = `HTTP error! Status: ${status}`;

        if (errorBody.detail) {
          errorMessage = errorBody.detail;
        } else if (status === 404) {
          errorMessage = "Resource not found.";
        } else if (status === 429) {
          errorMessage = "Too many requests. Please try again shortly.";
        } else if (status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }
        throw new Error(errorMessage);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn("Fetch aborted:", currentUrl);
      } else {
        console.error("Fetch error:", err);
        setError(err.message || "An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }, [url, options]); 
  useEffect(() => {
    if (initialUrl) { 
      fetchData(initialUrl, initialOptions);
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [initialUrl, JSON.stringify(initialOptions), fetchData]);

  return { data, loading, error, fetchData };
};

export default useApiFetch;