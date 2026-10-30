// App Store rating, fetched at build time so the site only shows it while it's true (brief: open item 8).
// The ratings are on the German store; the US store has none yet. Any failure hides the rating.
import { APP_STORE_ID } from '../consts';

export interface Rating {
  value: number;
  count: number;
}

export async function appStoreRating(): Promise<Rating | null> {
  try {
    const response = await fetch(`https://itunes.apple.com/lookup?id=${APP_STORE_ID}&country=de`, { signal: AbortSignal.timeout(5000) });
    const app = (await response.json()).results?.[0];
    const value = Number(app?.averageUserRating);
    const count = Number(app?.userRatingCount);
    return count > 0 && value > 0 ? { value: Math.round(value * 10) / 10, count } : null;
  } catch {
    return null;
  }
}
