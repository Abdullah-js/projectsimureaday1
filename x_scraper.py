""" code might work i am not sure never hada chance to test it since greedy x wants thousands of dollars
import os
import logging
import tweepy
import asyncio
import time

logger = logging.getLogger("uvicorn.error")

TWITTER_BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN")

twitter_client = None
if TWITTER_BEARER_TOKEN:
    try:
        twitter_client = tweepy.Client(bearer_token=TWITTER_BEARER_TOKEN)
        logger.info("Tweepy client initialized successfully for Twitter API.")
    except Exception as e:
        logger.error(f"Error initializing Tweepy client: {e}. X scraping will use mock data.")
        twitter_client = None
else:
    logger.warning("TWITTER_BEARER_TOKEN environment variable not set. X scraping will use mock data.")

async def scrape_x_data(keyword: str, limit: int = 10, max_retries: int = 3, initial_delay: int = 1) -> list[str]:
  
    if not twitter_client:
        logger.warning(f"Tweepy client not initialized. Using mock X data for '{keyword}'.")
        mock_x_posts = [
            f"Just bought more {keyword}! To the moon! 🚀",
            f"Bearish on {keyword} after earnings. Sell sell sell!",
            f"Watching {keyword} closely today. Big moves coming?",
            f"{keyword} is trending! What's everyone's price target?",
            f"Don't sleep on {keyword}. Undervalued gem.",
            f"My portfolio is all {keyword} and dreams.",
            f"Looks like {keyword} is about to break out.",
            f"Shorting {keyword}. Wish me luck.",
            f"Anyone else think {keyword} is overhyped?",
            f"Solid fundamentals on {keyword}, ignoring the noise.",
        ]
        return [post for post in mock_x_posts if keyword.lower() in post.lower()][:limit]

    logger.info(f"Scraping X (Twitter) for '{keyword}'...")
    retries = 0
    delay = initial_delay
    while retries < max_retries:
        try:
          
            query = f"${keyword} -is:retweet lang:en"
            
            tweets = await asyncio.to_thread(twitter_client.search_recent_tweets, query=query, max_results=limit)
            
            if tweets.data:
                x_texts = [tweet.text for tweet in tweets.data]
                logger.info(f"Successfully scraped {len(x_texts)} posts from X for '{keyword}'.")
                return x_texts
            else:
                logger.info(f"No tweets found for '{keyword}' on X.")
                return []
        except tweepy.TweepyException as e:
            logger.error(f"Tweepy API error during X scraping for '{keyword}' (Attempt {retries + 1}/{max_retries}): {e}")
            retries += 1
            if retries < max_retries:
                logger.info(f"Retrying X scraping in {delay} seconds...")
                await asyncio.sleep(delay)
                delay *= 2 
            else:
                logger.error(f"Max retries reached for X scraping for '{keyword}'. Falling back to empty list.")
                return []
        except Exception as e:
            logger.error(f"An unexpected error occurred during X (Twitter) scraping for '{keyword}': {e}")
            return []
    return []

    """