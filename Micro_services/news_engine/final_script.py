"""
Combined pipeline: fetch tech content from RSS/HN/Dev.to, then filter
by relevance using sentence embeddings. Produces filtered_feed.json.

pip3 install feedparser requests sentence-transformers
"""

import feedparser
import requests
import time
import json
from datetime import datetime
from sentence_transformers import SentenceTransformer, util

# ---------- CONFIG ----------

RSS_FEEDS = {
    "TechCrunch": "https://techcrunch.com/feed/",
    "The Verge": "https://www.theverge.com/rss/index.xml",
    "Ars Technica": "https://feeds.arstechnica.com/arstechnica/index",
    "Wired": "https://www.wired.com/feed/rss",
    "InfoQ": "https://feed.infoq.com/",
}

DEV_TO_TAGS = ["machinelearning", "ai", "programming", "webdev"]

HN_BASE = "https://hacker-news.firebaseio.com/v0"
HN_LIMIT = 30

REFERENCE_TOPICS = [
    "machine learning models and AI research",
    "new programming languages, frameworks, and developer tools",
    "startup funding and tech industry news",
    "software engineering best practices",
]

THRESHOLD = 0.35  # raise for stricter filtering, lower to keep more


# ---------- FETCHING ----------

def fetch_rss():
    items = []
    for source, url in RSS_FEEDS.items():
        feed = feedparser.parse(url)
        for entry in feed.entries:
            items.append({
                "title": entry.get("title", ""),
                "full_text": entry.get("summary", ""),
                "source": source,
                "url": entry.get("link", ""),
                "timestamp": entry.get("published", ""),
                "score": None,
            })
    return items


def fetch_hn(limit=HN_LIMIT):
    items = []
    top_ids = requests.get(f"{HN_BASE}/topstories.json").json()[:limit]
    for story_id in top_ids:
        story = requests.get(f"{HN_BASE}/item/{story_id}.json").json()
        if not story or story.get("type") != "story":
            continue
        items.append({
            "title": story.get("title", ""),
            "full_text": story.get("text", ""),
            "source": "Hacker News",
            "url": story.get("url", f"https://news.ycombinator.com/item?id={story_id}"),
            "timestamp": datetime.fromtimestamp(story.get("time", 0)).isoformat(),
            "score": story.get("score", 0),
        })
        time.sleep(0.05)
    return items


def fetch_devto(per_tag=15):
    items = []
    for tag in DEV_TO_TAGS:
        resp = requests.get(f"https://dev.to/api/articles?tag={tag}&per_page={per_tag}")
        for article in resp.json():
            items.append({
                "title": article.get("title", ""),
                "full_text": article.get("description", ""),
                "source": "Dev.to",
                "url": article.get("url", ""),
                "timestamp": article.get("published_at", ""),
                "score": article.get("positive_reactions_count", 0),
                "tag": tag,
            })
    return items


def fetch_all():
    items = []
    print("Fetching RSS...")
    items += fetch_rss()
    print("Fetching Hacker News...")
    items += fetch_hn()
    print("Fetching Dev.to...")
    items += fetch_devto()
    print(f"Total fetched: {len(items)}")
    return items


# ---------- FILTERING ----------

def filter_items(items):
    model = SentenceTransformer("all-MiniLM-L6-v2")
    reference_embeddings = model.encode(REFERENCE_TOPICS, convert_to_tensor=True)

    print("Scoring items...")
    for item in items:
        text = f"{item['title']} {item.get('full_text', '')}".strip()
        if not text:
            item["relevance_score"] = 0.0
            continue
        item_embedding = model.encode(text, convert_to_tensor=True)
        similarities = util.cos_sim(item_embedding, reference_embeddings)
        item["relevance_score"] = float(similarities.max())

    filtered = [i for i in items if i["relevance_score"] >= THRESHOLD]
    filtered.sort(key=lambda x: x["relevance_score"], reverse=True)
    print(f"Kept {len(filtered)} of {len(items)} items above threshold {THRESHOLD}")
    return filtered


# ---------- MAIN ----------

def main():
    raw_items = fetch_all()

    with open("tech_feed.json", "w") as f:
        json.dump(raw_items, f, indent=2)
    print("Saved raw data to tech_feed.json")

    filtered = filter_items(raw_items)

    with open("filtered_feed.json", "w") as f:
        json.dump(filtered, f, indent=2)
    print("Saved filtered data to filtered_feed.json")


if __name__ == "__main__":
    main()