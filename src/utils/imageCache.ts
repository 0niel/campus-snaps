import { LRUCache } from "lru-cache";

type CachedImage = {
  url: string;
  lastFetched: number;
};

const imageCache = new LRUCache<string, CachedImage>({
  max: 100,

  ttl: 1000 * 60 * 60,
});

export function getOptimizedImageUrl(originalUrl: string): string {
  if (!originalUrl.includes("campus-snaps.storage.yandexcloud.net")) {
    return originalUrl;
  }

  const cached = imageCache.get(originalUrl);
  if (cached && Date.now() - cached.lastFetched < 1000 * 60 * 60) {
    return cached.url;
  }

  imageCache.set(originalUrl, {
    url: originalUrl,
    lastFetched: Date.now(),
  });

  return originalUrl;
}

export function prewarmCache(urls: string[]): void {
  urls.forEach((url) => getOptimizedImageUrl(url));
}
