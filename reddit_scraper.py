import aiohttp
import asyncio
import re
import logging
from typing import List, Dict, Optional 

logger = logging.getLogger(__name__)

class RedditScrapingError(Exception):
    pass

async def scrape_reddit_data(
    symbol: str,
    company_name: str = "",
    subreddits: Optional[List[str]] = None 
) -> List[Dict]:
    search_terms = [symbol]
    if company_name:
        search_terms.append(company_name)
        if " Inc." in company_name:
            search_terms.append(company_name.replace(" Inc.", ""))
        if " Corp." in company_name:
            search_terms.append(company_name.replace(" Corp.", ""))
        if ", Inc." in company_name:
            search_terms.append(company_name.replace(", Inc.", ""))

    query_terms = list(set([term.lower() for term in search_terms]))

    target_subreddits = subreddits if subreddits is not None else ["wallstreetbets", "stocks", "investing", "stockmarket"]

    all_scraped_data = []
    unique_texts = set()

    base_urls = [f"https://www.reddit.com/r/{s}/search.json?q={symbol}&restrict_sr=on&sort=new&limit=25" for s in target_subreddits]

    if company_name and "all" not in target_subreddits: # Avoid adding r/all twice if already in custom list
        base_urls.append(f"https://www.reddit.com/r/all/search.json?q={company_name}&restrict_sr=on&sort=new&limit=10")

    async with aiohttp.ClientSession() as session:
        tasks = []
        for url in base_urls:
            tasks.append(fetch_reddit_posts(session, url))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for res in results:
            if isinstance(res, Exception):
                logger.error(f"Error fetching Reddit data: {res}")
                continue

            for post in res:
                text = post.get('data', {}).get('title', '') + " " + post.get('data', {}).get('selftext', '')
                url = "https://www.reddit.com" + post.get('data', {}).get('permalink', '')

                # ✅ ENHANCEMENT: Basic Markdown Cleanup
                cleaned_text = re.sub(r'http\S+|www\S+|@\S+|#\S+', '', text) # Remove URLs, mentions, hashtags
                cleaned_text = re.sub(r'(\*\*|__|~~|\*|_|`)', '', cleaned_text) # Remove bold, italics, strikethrough, inline code
                cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip() # Remove extra whitespace

                if cleaned_text and cleaned_text not in unique_texts:
                    if any(q_term in cleaned_text.lower() for q_term in query_terms):
                        all_scraped_data.append({"text": cleaned_text, "source_url": url})
                        unique_texts.add(cleaned_text)

    if not all_scraped_data:
        logger.warning(f"No relevant Reddit data found for symbol: {symbol}, name: {company_name}")

    return all_scraped_data


async def fetch_reddit_posts(session: aiohttp.ClientSession, url: str) -> List[Dict]:
    headers = {'User-Agent': 'StockHypeRecommender/1.0 (by /u/Few_Cockroach_7028)'}
    try:
        async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as response:
            response.raise_for_status()
            data = await response.json()
            return data.get('data', {}).get('children', [])
    except aiohttp.ClientError as e:
        raise RedditScrapingError(f"Network or client error fetching {url}: {e}")
    except asyncio.TimeoutError:
        raise asyncio.TimeoutError(f"Request to {url} timed out.")
    except Exception as e:
        raise RedditScrapingError(f"An unexpected error occurred during Reddit fetch from {url}: {e}")