import aiohttp
import asyncio
import logging
import os
import random 
from typing import Dict, List, Any, Optional 

logger = logging.getLogger(__name__)

class FMPAPIError(Exception):
    pass

class FMPConfigError(FMPAPIError):
    pass

class FMPNotFoundError(FMPAPIError):
    pass

class FMPRateLimitError(FMPAPIError):
    pass

class FMPServiceUnavailableError(FMPAPIError):
    pass

class FMPClient:
    BASE_URL = "https://financialmodelingprep.com/api/v3"
    DEFAULT_HEADERS = {"User-Agent": "StockHypeRecommender/1.0 (Contact: emirabdullahalaku@gmail.com)"} 

    def __init__(self, api_key: Optional[str]):
        if not api_key:
            raise FMPConfigError("FMP API Key is required but not provided.")
        self.api_key = api_key
        self.session: Optional[aiohttp.ClientSession] = None
        logger.info("FMPClient initialized.")

    async def _get_session(self) -> aiohttp.ClientSession:
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession(headers=self.DEFAULT_HEADERS) 
            logger.debug("New aiohttp ClientSession created for FMPClient.")
        return self.session

    async def close_session(self):
        if self.session and not self.session.closed:
            await self.session.close()
            self.session = None
            logger.info("aiohttp ClientSession closed for FMPClient.")

    async def _make_request(self, endpoint: str, params: Optional[Dict] = None, retries: int = 3) -> Any: 
        session = await self._get_session()
        url = f"{self.BASE_URL}/{endpoint}"
        full_params = {"apikey": self.api_key}
        if params:
            full_params.update(params)

        for attempt in range(retries):
            logger.debug(f"Making FMP API request to: {url} (Attempt {attempt + 1}/{retries})")
            try:
                async with session.get(url, params=full_params, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 404:
                        raise FMPNotFoundError(f"Data not found for endpoint: {endpoint}. URL: {url}")
                    elif response.status == 429:
                        raise FMPRateLimitError(f"FMP API rate limit exceeded. URL: {url}")
                    elif response.status == 503:
                        raise FMPServiceUnavailableError(f"FMP API service unavailable. URL: {url}")
                    response.raise_for_status()

                    data = await response.json()
                    if not data:
                        return None
                    return data
            except (FMPRateLimitError, FMPServiceUnavailableError) as e: 
                if attempt < retries - 1:
                    wait_time = (2 ** attempt) + random.random() * 0.5 
                    logger.warning(f"{e}. Retrying in {wait_time:.2f} seconds...")
                    await asyncio.sleep(wait_time)
                else:
                    raise 
            except aiohttp.ClientError as e:
                raise FMPAPIError(f"Network or client error during FMP API request to {endpoint}: {e}")
            except asyncio.TimeoutError:
                raise FMPAPIError(f"FMP API request to {endpoint} timed out.")
            except Exception as e:
                raise FMPAPIError(f"An unexpected error occurred during FMP API request to {endpoint}: {e}")
        
        raise FMPAPIError(f"Failed to complete FMP API request to {endpoint} after {retries} attempts.")

    async def get_stock_list(self) -> List[Dict[str, Any]]:
        """Fetches a list of all available stock symbols."""
        data = await self._make_request("stock/list")
        return data if data else []

    async def get_quote(self, symbol: str) -> Dict[str, Any]:
        """Fetches quote data for a specific stock symbol."""
        data = await self._make_request(f"quote/{symbol}")
        return data[0] if data and isinstance(data, list) else {}

    async def get_company_news(self, symbol: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetches recent news for a specific company."""
        data = await self._make_request(f"press-releases/{symbol}", {"limit": limit})
        return data if data else []