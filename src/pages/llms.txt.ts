// /llms.txt (llmstxt.org): a plain-text map of the site for AI assistants and answer engines.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { APP_STORE_URL, CONTACT_EMAIL, INSTAGRAM_URL, PLAY_STORE_URL, SITE_URL } from '../consts';
import { monthRanges, sortByDate } from '../lib/routes';

export const GET: APIRoute = async () => {
  const routes = sortByDate(await getCollection('routes'));
  const body = `# Xplore

> Xplore is a free travel map, travel tracker and trip planner app for iPhone and Android. Every place you've been becomes a collectible card: track the countries you've visited, collect 900+ places in 44 collections, and plan trips for the best time of year.

Key facts:
- Free to download; all 199 country cards are free. Optional one-time bundles: Cities, Islands & Regions and Wildlife ($0.99 each), Explorer ($1.99). No subscription, no ads.
- 900+ cards (countries, landmarks, islands & regions, wildlife, cities, events) in 4 rarities: Common, Uncommon, Rare, Epic.
- Best months to visit (and months to avoid) for 199 countries, per activity (7 activities).
- Photo scan matches travel photos to places on the device; photos never leave the phone.
- Day-by-day trip planner, shareable with friends. Guest mode: no sign-up needed to start.
- Made by Daniel Feile in Cologne, Germany. Contact: ${CONTACT_EMAIL}

## Pages
- [Home](${SITE_URL}/): what Xplore is and how it works
- [Features](${SITE_URL}/features): every feature, bundles and prices, FAQ
- [About](${SITE_URL}/about): facts about the app and who makes it
- [Travel routes](${SITE_URL}/routes): hand-picked itineraries built from Xplore cards
- [Privacy](${SITE_URL}/privacy): how the app and this website handle data

## Travel routes
${routes.map((r) => `- [${r.data.title}](${SITE_URL}/routes/${r.data.slug}): ${r.data.summary} ${r.data.durationDays} days; best ${monthRanges(r.data.bestMonths, 'long')}.`).join('\n')}

## Get the app
- [App Store](${APP_STORE_URL})
- [Google Play](${PLAY_STORE_URL})
- [Instagram](${INSTAGRAM_URL})
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
