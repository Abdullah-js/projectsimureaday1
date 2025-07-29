document.addEventListener('DOMContentLoaded', () => {
    const tickerSelect = document.getElementById('ticker-select');
    const analyzeButton = document.getElementById('analyze-button');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const resultsSection = document.getElementById('results-section');

    const resultSymbol = document.getElementById('result-symbol');
    const sentimentScore = document.getElementById('sentiment-score');
    const sentimentCategory = document.getElementById('sentiment-category');
    const sentimentPosts = document.getElementById('sentiment-posts');
    const financialPrice = document.getElementById('financial-price');
    const financialChange = document.getElementById('financial-change');
    const financialMarketCap = document.getElementById('financial-market-cap');
    const financialPeRatio = document.getElementById('financial-pe-ratio');
    const financialSource = document.getElementById('financial-source');
    const newsList = document.getElementById('news-list');

    const BACKEND_URL = 'http://localhost:8001';
    function showElement(element) {
        element.classList.remove('hidden');
    }

    function hideElement(element) {
        element.classList.add('hidden');
    }

    function displayError(message) {
        errorMessage.textContent = `Error: ${message}`;
        showElement(errorMessage);
        hideElement(loadingSpinner);
        hideElement(resultsSection);
    }

    function clearError() {
        hideElement(errorMessage);
        errorMessage.textContent = '';
    }

    async function fetchTickers() {
        try {
            const response = await fetch(`${BACKEND_URL}/tickers`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fetch tickers.');
            }
            const tickers = await response.json();
            
            tickerSelect.innerHTML = '<option value="">Select a ticker</option>'; 
            tickers.forEach(ticker => {
                const option = document.createElement('option');
                option.value = ticker.symbol;
                option.textContent = `${ticker.symbol} - ${ticker.name}`;
                tickerSelect.appendChild(option);
            });
            analyzeButton.disabled = false; 
            clearError();
        } catch (error) {
            console.error('Error fetching tickers:', error);
            displayError(`Failed to load stock tickers: ${error.message}. Please ensure the backend is running and FMP_API_KEY is configured.`);
            tickerSelect.innerHTML = '<option value="">Error loading tickers</option>';
        }
    }

    async function analyzeStock() {
        const symbol = tickerSelect.value;
        if (!symbol) {
            displayError('Please select a stock ticker.');
            return;
        }

        clearError();
        hideElement(resultsSection);
        showElement(loadingSpinner);
        analyzeButton.disabled = true;

        try {
            
            const selectedOption = tickerSelect.options[tickerSelect.selectedIndex];
            const name = selectedOption.textContent.split(' - ')[1] || ''; 

            const response = await fetch(`${BACKEND_URL}/analyze?symbol=${symbol}&name=${encodeURIComponent(name)}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to analyze stock.');
            }
            const data = await response.json();
            
            resultSymbol.textContent = symbol;

            sentimentScore.textContent = data.sentiment.score;
            sentimentCategory.textContent = data.sentiment.category;
            sentimentCategory.className = ''; 
            sentimentCategory.classList.add(data.sentiment.category); 
            sentimentPosts.textContent = data.sentiment.total_posts_analyzed;

            financialPrice.textContent = data.financial_data.price ? `$${data.financial_data.price.toFixed(2)}` : 'N/A';
            financialChange.textContent = data.financial_data.changesPercentage ? `${data.financial_data.changesPercentage.toFixed(2)}%` : 'N/A';
            financialMarketCap.textContent = data.financial_data.marketCap ? `$${(data.financial_data.marketCap / 1e9).toFixed(2)}B` : 'N/A';
            financialPeRatio.textContent = data.financial_data.peRatio ? data.financial_data.peRatio.toFixed(2) : 'N/A';
            financialSource.textContent = data.financial_data.source || 'N/A';


            newsList.innerHTML = ''; 
            if (data.recent_news && data.recent_news.length > 0) {
                data.recent_news.forEach(newsItem => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = newsItem.url || '#';
                    a.textContent = newsItem.title || 'No Title';
                    a.target = '_blank';
                    li.appendChild(a);
                    newsList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = 'No recent news found.';
                newsList.appendChild(li);
            }

            hideElement(loadingSpinner);
            showElement(resultsSection);
            analyzeButton.disabled = false; 
            clearError();

        } catch (error) {
            console.error('Error analyzing stock:', error);
            displayError(`Failed to analyze stock: ${error.message}.`);
            analyzeButton.disabled = false; 
        }
    }

    tickerSelect.addEventListener('change', () => {
        analyzeButton.disabled = !tickerSelect.value;
    });

    analyzeButton.addEventListener('click', analyzeStock);

    fetchTickers();
});
