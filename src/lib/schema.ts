// Schema.org nodes shared across pages. Pages reference them by @id, so search engines and AI answer
// engines can tie the site, the app and its maker together. Facts: the brief's reference/data-facts.md.
import { APP_STORE_URL, CONTACT_EMAIL, INSTAGRAM_URL, PLAY_STORE_URL, SITE_NAME, SITE_URL } from '../consts';

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const APP_ID = `${SITE_URL}/#app`;
export const FOUNDER_ID = `${SITE_URL}/about#founder`;

export const ORGANIZATION = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/assets/brand/app-store-icon-1024.png`,
  email: CONTACT_EMAIL,
  founder: { '@type': 'Person', '@id': FOUNDER_ID, name: 'Daniel Feile' },
  address: { '@type': 'PostalAddress', addressLocality: 'Köln', addressCountry: 'DE' },
  sameAs: [APP_STORE_URL, PLAY_STORE_URL, INSTAGRAM_URL],
};

export const WEBSITE = {
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  inLanguage: 'en',
  publisher: { '@id': ORG_ID },
};

export const APP = {
  '@type': 'MobileApplication',
  '@id': APP_ID,
  name: SITE_NAME,
  description:
    "Xplore is a travel map, travel tracker and trip planner for iPhone and Android. Every place you've been becomes a collectible card: track the countries you've visited, collect 900+ places in 44 collections and plan trips for the best time of year.",
  url: `${SITE_URL}/`,
  image: `${SITE_URL}/assets/brand/app-store-icon-1024.png`,
  screenshot: [
    `${SITE_URL}/assets/store/ios-01-discover-swipe.webp`,
    `${SITE_URL}/assets/store/ios-02-collect-rarity.webp`,
    `${SITE_URL}/assets/store/ios-05-best-time.webp`,
  ],
  operatingSystem: 'iOS 15.1 or later, Android',
  applicationCategory: 'TravelApplication',
  inLanguage: 'en',
  isAccessibleForFree: true,
  author: { '@id': ORG_ID },
  publisher: { '@id': ORG_ID },
  installUrl: [APP_STORE_URL, PLAY_STORE_URL],
  featureList: [
    'Travel map of every country and place you have visited',
    '900+ collectible place and wildlife cards in 4 rarities',
    'Best time to visit for 199 countries, per activity',
    'Day-by-day trip planner, shareable with friends',
    'Photo scan that finds places in your travel photos on the device',
    'Year in review story, exportable as video',
    'Medals, 11 explorer levels and friend leaderboards',
  ],
  // Same names and prices as the bundles table on /features.
  offers: [
    { '@type': 'Offer', name: 'Countries (all 199 country cards)', price: '0', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Cities bundle', price: '0.99', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Islands & Regions bundle', price: '0.99', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Wildlife bundle', price: '0.99', priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Explorer bundle', price: '1.99', priceCurrency: 'USD' },
  ],
};

/** BreadcrumbList from [name, path] pairs, starting after Home. */
export function breadcrumbs(...trail: [string, string][]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [['Home', '/'] as [string, string], ...trail].map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: new URL(path, SITE_URL).href,
    })),
  };
}
