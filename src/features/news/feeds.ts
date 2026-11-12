export const NEWS_CATEGORIES = [
  "Technology",
  "Artificial Intelligence",
  "Programming",
  "Web Development",
  "Cybersecurity",
  "Open Source",
  "Software Engineering",
  "Tech Industry",
] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export type FeedSource = {
  id: string;
  name: string;
  url: string;
  homepage: string;
  category: NewsCategory;
};

/**
 * Publisher-provided RSS/Atom feeds. These are published by each site for
 * syndication; nhOS shows only the headline, the feed's own summary and
 * image, with attribution and a link to the original article.
 * Add or remove sources here.
 */
export const FEED_SOURCES: FeedSource[] = [
  { id: "verge", name: "The Verge", url: "https://www.theverge.com/rss/index.xml", homepage: "https://www.theverge.com", category: "Technology" },
  { id: "ars", name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index", homepage: "https://arstechnica.com", category: "Technology" },
  { id: "mittr-ai", name: "MIT Technology Review", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed", homepage: "https://www.technologyreview.com", category: "Artificial Intelligence" },
  { id: "hf", name: "Hugging Face Blog", url: "https://huggingface.co/blog/feed.xml", homepage: "https://huggingface.co/blog", category: "Artificial Intelligence" },
  { id: "simonw", name: "Simon Willison", url: "https://simonwillison.net/atom/everything/", homepage: "https://simonwillison.net", category: "Artificial Intelligence" },
  { id: "github", name: "GitHub Blog", url: "https://github.blog/feed/", homepage: "https://github.blog", category: "Programming" },
  { id: "so", name: "Stack Overflow Blog", url: "https://stackoverflow.blog/feed/", homepage: "https://stackoverflow.blog", category: "Programming" },
  { id: "smashing", name: "Smashing Magazine", url: "https://www.smashingmagazine.com/feed/", homepage: "https://www.smashingmagazine.com", category: "Web Development" },
  { id: "webdev", name: "web.dev", url: "https://web.dev/static/blog/feed.xml", homepage: "https://web.dev", category: "Web Development" },
  { id: "chrome", name: "Chrome for Developers", url: "https://developer.chrome.com/static/blog/feed.xml", homepage: "https://developer.chrome.com", category: "Web Development" },
  { id: "bleeping", name: "BleepingComputer", url: "https://www.bleepingcomputer.com/feed/", homepage: "https://www.bleepingcomputer.com", category: "Cybersecurity" },
  { id: "krebs", name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/", homepage: "https://krebsonsecurity.com", category: "Cybersecurity" },
  { id: "thn", name: "The Hacker News", url: "https://feeds.feedburner.com/TheHackersNews", homepage: "https://thehackernews.com", category: "Cybersecurity" },
  { id: "gh-oss", name: "GitHub Open Source", url: "https://github.blog/open-source/feed/", homepage: "https://github.blog/open-source/", category: "Open Source" },
  { id: "lwn", name: "LWN.net", url: "https://lwn.net/headlines/rss", homepage: "https://lwn.net", category: "Open Source" },
  { id: "fowler", name: "Martin Fowler", url: "https://martinfowler.com/feed.atom", homepage: "https://martinfowler.com", category: "Software Engineering" },
  { id: "infoq", name: "InfoQ", url: "https://feed.infoq.com/", homepage: "https://www.infoq.com", category: "Software Engineering" },
  { id: "techcrunch", name: "TechCrunch", url: "https://techcrunch.com/feed/", homepage: "https://techcrunch.com", category: "Tech Industry" },
  { id: "hn", name: "Hacker News (front page)", url: "https://hnrss.org/frontpage", homepage: "https://news.ycombinator.com", category: "Tech Industry" },
];

export type NewsArticle = {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  publishedAt: string | null;
  source: string;
  sourceId: string;
  sourceHomepage: string;
  category: NewsCategory;
};

export type FeedStatus = { id: string; name: string; ok: boolean; count: number; error?: string };
