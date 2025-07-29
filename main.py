from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os
from dotenv import load_dotenv
import time
from typing import List, Dict, Optional, Any
import asyncio
import re
from logging.handlers import RotatingFileHandler

from starlette.background import BackgroundTasks



load_dotenv()

from reddit_scraper import scrape_reddit_data, RedditScrapingError

from fmp_api_client_aiohttp import (
    FMPClient,
    FMPAPIError,
    FMPConfigError,
    FMPNotFoundError,
    FMPRateLimitError,
    FMPServiceUnavailableError
)

#Configuration 
FMP_API_KEY = os.getenv("FMP_API_KEY")
DEFAULT_SUBREDDITS = ["wallstreetbets", "stocks", "investing", "stockmarket"]

# FastAPI Initialization 
app = FastAPI(
    title="Stock Hype Recommender Backend",
    description="Analyzes Reddit sentiment, live stock data, and news.",
    version="2.2.4",
)

# --- CORS Configuration ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8001",
    "http://127.0.0.1:8001",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging Configuration 
log_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
log_file_handler = RotatingFileHandler('api.log', maxBytes=10485760, backupCount=5)
log_file_handler.setFormatter(log_formatter)

root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
root_logger.addHandler(log_file_handler)

console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)
root_logger.addHandler(console_handler)

logger = logging.getLogger(__name__)

#  Global FMP Client Instance 
fmp_client: Optional[FMPClient] = None

@app.on_event("startup")
async def startup_event():
    global fmp_client
    try:
        fmp_client = FMPClient(FMP_API_KEY)
        logger.info("FMPClient initialized successfully during startup.")
    except FMPConfigError as e:
        logger.error(f"FMP_API_KEY is missing or invalid. FMP API features will not be available: {e}")
        fmp_client = None

@app.on_event("shutdown")
async def shutdown_event():
    global fmp_client
    if fmp_client:
        await fmp_client.close_session()
        logger.info("FMPClient aiohttp session closed during shutdown.")

sentiment_cache = {"data": {}, "lock": asyncio.Lock()}
financial_data_cache = {"data": {}, "lock": asyncio.Lock()}
news_cache = {"data": {}, "lock": asyncio.Lock()}
ticker_cache = {"data": None, "timestamp": 0, "lock": asyncio.Lock()}

CACHE_EXPIRATION_SECONDS = 300
FINANCIAL_DATA_CACHE_EXPIRATION_SECONDS = 300
NEWS_CACHE_EXPIRATION_SECONDS = 600
TICKER_CACHE_EXPIRATION_SECONDS = 86400


async def _get_cached_item(cache: Dict[str, Any], key: str, expiration: int) -> Optional[Any]:
    async with cache["lock"]:
        item = cache["data"].get(key)
        if item and (time.time() - item["timestamp"]) < expiration:
            logger.debug(f"Returning cached data for {key} from {cache} cache.")
            return item["data"]
        return None

async def _set_cached_item(cache: Dict[str, Any], key: str, data: Any):
    async with cache["lock"]:
        cache["data"][key] = {"data": data, "timestamp": time.time()}
        logger.debug(f"Set data for {key} in {cache} cache.")

async def _fetch_tickers_from_fmp() -> List[Dict[str, str]]:
    if not fmp_client:
        logger.error("FMPClient is not initialized, cannot fetch tickers.")
        raise HTTPException(status_code=500, detail="Financial Modeling Prep API client is not initialized.")

    logger.info("Fetching new ticker list from Financial Modeling Prep API.")
    try:
        all_stocks = await fmp_client.get_stock_list()
        filtered_stocks = [
            {"symbol": s["symbol"], "name": s.get("name", "")}
            for s in all_stocks
            if s.get("exchangeShortName") in ["NASDAQ", "NYSE"] and s.get("type") == "stock"
        ]
        await _set_cached_item(ticker_cache, "all_tickers", filtered_stocks)
        return filtered_stocks
    except FMPAPIError as e:
        logger.error(f"FMP API Error fetching tickers: {e}")
        if isinstance(e, FMPRateLimitError):
            raise HTTPException(status_code=429, detail=f"FMP API rate limit exceeded: {str(e)}")
        elif isinstance(e, FMPServiceUnavailableError):
            raise HTTPException(status_code=503, detail=f"FMP API service temporarily unavailable: {str(e)}")
        elif isinstance(e, FMPNotFoundError):
             raise HTTPException(status_code=404, detail=f"Stock list not found: {str(e)}")
        else:
            raise HTTPException(status_code=502, detail=f"Could not retrieve stock list from data provider: {str(e)}")
    except Exception as e:
        logger.exception("An unexpected error occurred while fetching tickers:")
        raise HTTPException(status_code=500, detail=f"An unexpected internal error occurred: {e}")

async def _process_reddit_sentiment(symbol: str, company_name: str) -> Dict[str, Any]:
    reddit_posts_texts = []
    try:
        scraped_data = await scrape_reddit_data(symbol, company_name, subreddits=DEFAULT_SUBREDDITS)
        reddit_posts_texts = [item["text"] for item in scraped_data]
        logger.info(f"Scraped {len(reddit_posts_texts)} unique posts/comments from Reddit for {symbol}")
    except RedditScrapingError as e:
        logger.error(f"Reddit scraping error for {symbol}: {e}")
    except asyncio.TimeoutError:
        logger.error(f"Reddit scraping timed out for symbol {symbol}.")
    except Exception as e:
        logger.exception(f"An unexpected error occurred during Reddit scraping for {symbol}:")

    sentiment_score = 0.0
    sentiment_category = "neutral"
    if reddit_posts_texts:
        if len(reddit_posts_texts) > 5:
            sentiment_score = 0.35
            sentiment_category = "positive"
        elif len(reddit_posts_texts) < 3:
            sentiment_score = -0.2
            sentiment_category = "negative"
        else:
            sentiment_score = 0.05
            sentiment_category = "neutral"

    sentiment_result = {
        "score": round(sentiment_score, 4),
        "category": sentiment_category,
        "total_posts_analyzed": len(reddit_posts_texts),
    }
    await _set_cached_item(sentiment_cache, symbol, sentiment_result)
    logger.info(f"Sentiment for {symbol}: {sentiment_result}")
    return sentiment_result

async def _fetch_financial_data(symbol: str) -> Dict[str, Any]:
    """Fetches financial quote data from FMP API."""
    if not fmp_client:
        return {"source": "FMP (Not Available)", "error": "API Key not configured."}

    try:
        fmp_quote = await fmp_client.get_quote(symbol)
        financial_data = {
            "price": fmp_quote.get("price"),
            "changesPercentage": fmp_quote.get("changesPercentage"),
            "marketCap": fmp_quote.get("marketCap"),
            "peRatio": fmp_quote.get("peRatio"),
            "source": "FMP",
        }
        await _set_cached_item(financial_data_cache, symbol, financial_data)
        logger.info(f"Fetched financial data for {symbol}: Price={financial_data.get('price')}")
        return financial_data
    except FMPNotFoundError:
        logger.warning(f"No financial quote found for {symbol} from FMP.")
        return {"source": "FMP (Not Found)"}
    except FMPAPIError as e:
        logger.error(f"FMP API Error fetching financial data for {symbol}: {e}")
        return {"source": f"FMP (Error: {e.__class__.__name__})", "error": str(e)}
    except Exception as e:
        logger.exception(f"Unexpected error fetching financial data for {symbol}:")
        return {"source": "FMP (Unexpected Error)", "error": str(e)}

async def _fetch_recent_news(symbol: str) -> List[Dict[str, Any]]:
    """Fetches recent news articles from FMP API."""
    if not fmp_client:
        return [{"title": "FMP News Not Available", "url": "#", "error": "API Key not configured."}]

    try:
        fmp_news = await fmp_client.get_company_news(symbol)
        recent_news = [
            {"title": item.get("title"), "url": item.get("url"), "publishedDate": item.get("publishedDate")}
            for item in fmp_news[:8]
        ]
        await _set_cached_item(news_cache, symbol, recent_news)
        logger.info(f"Fetched {len(recent_news)} news articles for {symbol}.")
        return recent_news
    except FMPNotFoundError:
        logger.warning(f"No news found for {symbol} from FMP.")
        return []
    except FMPAPIError as e:
        logger.error(f"FMP API Error fetching news for {symbol}: {e}")
        return [{"title": f"FMP News Fetch Error ({e.__class__.__name__})", "url": "#", "error": str(e)}]
    except Exception as e:
        logger.exception(f"Unexpected error fetching news for {symbol}:")
        return [{"title": "FMP News Unexpected Error", "url": "#", "error": str(e)}]


@app.get("/")
async def root():
    return {"message": "Stock Hype Recommender API v2.2.4 is running."}

@app.get("/tickers", response_model=List[Dict[str, str]])
async def get_all_tickers():
    """
    Provides a list of all available stock tickers from NASDAQ, NYSE, etc.
    The list is cached to improve performance.
    """
    cached_tickers = await _get_cached_item(ticker_cache, "all_tickers", TICKER_CACHE_EXPIRATION_SECONDS)
    if cached_tickers:
        logger.info("Returning cached ticker list.")
        return JSONResponse(content=cached_tickers, headers={"Cache-Control": f"max-age={TICKER_CACHE_EXPIRATION_SECONDS}"})

    fresh_tickers = await _fetch_tickers_from_fmp()
    return JSONResponse(content=fresh_tickers, headers={"Cache-Control": f"max-age={TICKER_CACHE_EXPIRATION_SECONDS}"})


@app.get("/analyze")
async def analyze(
    background_tasks: BackgroundTasks, 
    symbol: str = Query(..., min_length=1, description="Stock ticker symbol (e.g. TSLA, GME)"),
    name: str = Query("", description="Company name for a more accurate search (e.g. Tesla, Inc.)")
):
    symbol = symbol.strip().upper()
    name = name.strip()
    if not re.match(r"^[a-zA-Z0-9\s.,&'-]+$", name) and name:
        logger.warning(f"Sanitizing potentially invalid company name: {name}")
        name = re.sub(r"[^a-zA-Z0-9\s.,&'-]", "", name).strip()

    if not symbol.isalnum():
        logger.warning(f"Invalid symbol format received: {symbol}")
        raise HTTPException(status_code=400, detail="Invalid stock symbol format. Only alphanumeric characters are allowed.")

    sentiment = await _get_cached_item(sentiment_cache, symbol, CACHE_EXPIRATION_SECONDS)
    financial_data = await _get_cached_item(financial_data_cache, symbol, FINANCIAL_DATA_CACHE_EXPIRATION_SECONDS)
    recent_news = await _get_cached_item(news_cache, symbol, NEWS_CACHE_EXPIRATION_SECONDS)

    all_cached_fresh = sentiment and financial_data and recent_news

    if all_cached_fresh:
        logger.info(f"Returning fully cached analysis data for {symbol}")
        response_data = {
            "symbol": symbol,
            "sentiment": sentiment,
            "financial_data": financial_data,
            "recent_news": recent_news,
        }
        max_cache_age = max(CACHE_EXPIRATION_SECONDS, FINANCIAL_DATA_CACHE_EXPIRATION_SECONDS, NEWS_CACHE_EXPIRATION_SECONDS)
        return JSONResponse(content=response_data, headers={"Cache-Control": f"max-age={max_cache_age}"})

    logger.info(f"Initiating fetch for missing/stale analysis data for symbol: {symbol}")

    async def _fetch_and_cache_sentiment_bg():
        if not sentiment:
            await _process_reddit_sentiment(symbol, name)

    financial_data_task = _fetch_financial_data(symbol) if not financial_data else asyncio.sleep(0)
    news_task = _fetch_recent_news(symbol) if not recent_news else asyncio.sleep(0)

    background_tasks.add_task(_fetch_and_cache_sentiment_bg)

    fetched_financial_data, fetched_news = await asyncio.gather(financial_data_task, news_task)

    final_sentiment = sentiment or {"score": 0.0, "category": "neutral", "total_posts_analyzed": 0, "status": "fetching in background"}
    final_financial_data = fetched_financial_data if fetched_financial_data else financial_data
    final_news = fetched_news if fetched_news else recent_news

    response_data = {
        "symbol": symbol,
        "sentiment": final_sentiment,
        "financial_data": final_financial_data,
        "recent_news": final_news,
    }

    max_cache_age_response = max(CACHE_EXPIRATION_SECONDS, FINANCIAL_DATA_CACHE_EXPIRATION_SECONDS, NEWS_CACHE_EXPIRATION_SECONDS)
    return JSONResponse(content=response_data, headers={"Cache-Control": f"max-age={max_cache_age_response}"})