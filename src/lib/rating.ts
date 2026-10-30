// Store ratings, fetched at build time so the site only shows them while they're true (brief: open item 8).
// Any failure, or a store without a public rating yet, hides that store's rating.
import { APP_STORE_ID, APP_STORE_URL, PLAY_STORE_URL } from '../consts';

export interface Rating {
  store: 'App Store' | 'Google Play';
  url: string;
  value: number;
  count: number;
}

const round = (value: number) => Math.round(value * 10) / 10;

/** The App Store ratings are on the German store; the US store has none yet. */
export async function appStoreRating(): Promise<Rating | null> {
  try {
    const response = await fetch(`https://itunes.apple.com/lookup?id=${APP_STORE_ID}&country=de`, { signal: AbortSignal.timeout(5000) });
    const app = (await response.json()).results?.[0];
    const value = Number(app?.averageUserRating);
    const count = Number(app?.userRatingCount);
    return count > 0 && value > 0 ? { store: 'App Store', url: APP_STORE_URL, value: round(value), count } : null;
  } catch {
    return null;
  }
}

/** Google Play has no API for this; its listing page carries the rating in its schema.org data once it shows one. */
export function parsePlayRating(html: string): Rating | null {
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)) {
    try {
      const rating = JSON.parse(json).aggregateRating;
      const value = Number(rating?.ratingValue);
      const count = Number(rating?.ratingCount);
      if (count > 0 && value > 0) return { store: 'Google Play', url: PLAY_STORE_URL, value: round(value), count };
    } catch {
      // Not the block we're looking for.
    }
  }
  return null;
}

export async function playStoreRating(): Promise<Rating | null> {
  try {
    const response = await fetch(`${PLAY_STORE_URL}&hl=en&gl=de`, { signal: AbortSignal.timeout(5000) });
    return parsePlayRating(await response.text());
  } catch {
    return null;
  }
}

/** Every store with a public rating, App Store first. */
export async function storeRatings(): Promise<Rating[]> {
  return (await Promise.all([appStoreRating(), playStoreRating()])).filter((r): r is Rating => r !== null);
}

/** One schema.org AggregateRating across stores: the count-weighted average of the visible ratings. */
export function aggregateRating(ratings: Rating[]) {
  if (ratings.length === 0) return undefined;
  const count = ratings.reduce((sum, r) => sum + r.count, 0);
  const value = ratings.reduce((sum, r) => sum + r.value * r.count, 0) / count;
  return { '@type': 'AggregateRating', ratingValue: round(value), ratingCount: count, bestRating: 5, worstRating: 1 };
}

// Reviewer names are deliberately not kept: the site doesn't show who wrote a review.
export interface Review {
  id: string;
  date: Date;
  rating: number;
  title: string;
  body: string;
  /** Set when the review isn't in English; then `translation` holds the English version. */
  lang?: string;
  translation?: { title: string; body: string };
}

type Translations = Record<string, { lang: string; title: string; body: string }>;

/** Entries of an App Store customer-reviews feed (itunes.apple.com/<country>/rss/customerreviews/…/json). */
export function parseAppStoreReviews(feed: unknown, translations: Translations = {}): Review[] {
  const entries = (feed as { feed?: { entry?: unknown } })?.feed?.entry;
  const list = (Array.isArray(entries) ? entries : entries ? [entries] : []) as Record<string, any>[];
  return list.flatMap((e) => {
    const id = e.id?.label;
    const rating = Number(e['im:rating']?.label);
    const body = e.content?.label?.trim();
    if (!id || !body || !(rating >= 1 && rating <= 5)) return [];
    const t = translations[id];
    return [{
      id,
      date: new Date(e.updated?.label),
      rating,
      title: e.title?.label?.trim() ?? '',
      body,
      ...(t && { lang: t.lang, translation: { title: t.title, body: t.body } }),
    }];
  });
}

// Storefronts where people have reviewed Xplore so far; the feed is per country.
const REVIEW_STOREFRONTS = ['de', 'at', 'ch', 'gb', 'us'];

/** Every written App Store review, newest first. Failed storefronts are skipped. */
export async function appStoreReviews(translations: Translations = {}): Promise<Review[]> {
  const feeds = await Promise.all(
    REVIEW_STOREFRONTS.map(async (country) => {
      try {
        const url = `https://itunes.apple.com/${country}/rss/customerreviews/page=1/id=${APP_STORE_ID}/sortby=mostrecent/json`;
        return parseAppStoreReviews(await (await fetch(url, { signal: AbortSignal.timeout(5000) })).json(), translations);
      } catch {
        return [];
      }
    }),
  );
  const byId = new Map(feeds.flat().map((r) => [r.id, r]));
  return [...byId.values()].sort((a, b) => b.date.getTime() - a.date.getTime());
}
