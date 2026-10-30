import type { CollectionEntry } from 'astro:content';

export type Route = CollectionEntry<'routes'>;

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

// App activity keys → labels (brief: 03-content/blog-index.md › Filters).
export const ACTIVITY_LABELS: Record<string, string> = {
  culture: 'City & Culture',
  diving: 'Diving & Snorkeling',
  hiking: 'Hiking & Trekking',
  safari: 'Safari & Wildlife',
  surfing: 'Surfing',
  skiing: 'Skiing & Snow',
  beach: 'Beach & Coastal',
};

export const REGIONS = ['Asia', 'Europe', 'Americas', 'Africa', 'Oceania', 'Middle East'] as const;

export const DURATIONS = [
  { key: 'weekend', label: 'Weekend', max: 3 },
  { key: '1-week', label: '1 week', max: 10 },
  { key: '2-weeks', label: '2 weeks', max: 17 },
  { key: '3-weeks', label: '3+ weeks', max: Infinity },
] as const;

/** Filter bucket for a route's length: ≤3 days, ≤10, ≤17, longer. */
export function durationBucket(days: number): (typeof DURATIONS)[number]['key'] {
  return DURATIONS.find((d) => days <= d.max)!.key;
}

export const IN_APP_LABELS = {
  available: 'In the app',
  'coming-soon': 'Coming to the app',
} as const;

/** "Mar–May, Oct–Nov": collapses consecutive months into ranges. */
export function monthRanges(months: readonly string[]): string {
  const idx = months.map((m) => MONTHS.indexOf(m as (typeof MONTHS)[number])).sort((a, b) => a - b);
  const ranges: string[] = [];
  for (let i = 0; i < idx.length; i++) {
    const start = idx[i];
    while (idx[i + 1] === idx[i] + 1) i++;
    ranges.push(start === idx[i] ? MONTHS[start] : `${MONTHS[start]}–${MONTHS[idx[i]]}`);
  }
  return ranges.join(', ');
}

export function nightsLabel(nights: number): string {
  if (nights === 0) return 'Day stop';
  return nights === 1 ? '1 night' : `${nights} nights`;
}

export function sortByDate(routes: Route[]): Route[] {
  return [...routes].sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}
