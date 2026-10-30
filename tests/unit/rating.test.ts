import { describe, expect, it } from 'vitest';
import { aggregateRating, parseAppStoreReviews, parsePlayRating } from '../../src/lib/rating';

describe('parsePlayRating', () => {
  const page = (ld: object) => `<html><script type="application/ld+json" nonce="x">${JSON.stringify(ld)}</script></html>`;

  it('reads the rating from the listing schema.org data', () => {
    const rating = parsePlayRating(page({ '@type': 'SoftwareApplication', aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.66', ratingCount: '12' } }));
    expect(rating).toMatchObject({ store: 'Google Play', value: 4.7, count: 12 });
  });

  it('returns null while the listing shows no rating', () => {
    expect(parsePlayRating(page({ '@type': 'SoftwareApplication', name: 'Xplore' }))).toBeNull();
    expect(parsePlayRating('<html>not a listing</html>')).toBeNull();
  });
});

describe('aggregateRating', () => {
  it('weights each store by its number of ratings', () => {
    const r = aggregateRating([
      { store: 'App Store', url: '', value: 5, count: 30 },
      { store: 'Google Play', url: '', value: 4, count: 10 },
    ]);
    expect(r).toMatchObject({ ratingValue: 4.8, ratingCount: 40 });
  });

  it('is absent without ratings', () => {
    expect(aggregateRating([])).toBeUndefined();
  });
});

describe('parseAppStoreReviews', () => {
  const entry = (id: string, rating: string, body: string) => ({
    id: { label: id },
    author: { name: { label: 'Traveller' } },
    updated: { label: '2026-10-22T07:16:08-07:00' },
    'im:rating': { label: rating },
    title: { label: 'Tolle App' },
    content: { label: body },
  });

  it('reads reviews and attaches translations', () => {
    const [review] = parseAppStoreReviews(
      { feed: { entry: [entry('1', '5', 'Für Reisen optimal.')] } },
      { 1: { lang: 'de', title: 'Great app', body: 'Ideal for travelling.' } },
    );
    // The site doesn't show who wrote a review.
    expect(review).not.toHaveProperty('author');
    expect(review).toMatchObject({ id: '1', rating: 5, title: 'Tolle App', body: 'Für Reisen optimal.', lang: 'de', translation: { body: 'Ideal for travelling.' } });
  });

  it('handles a single entry, an empty feed and broken entries', () => {
    expect(parseAppStoreReviews({ feed: { entry: entry('1', '4', 'Nice') } })).toHaveLength(1);
    expect(parseAppStoreReviews({ feed: {} })).toEqual([]);
    expect(parseAppStoreReviews({ feed: { entry: [entry('2', '9', 'x'), entry('3', '5', ' ')] } })).toEqual([]);
  });
});
