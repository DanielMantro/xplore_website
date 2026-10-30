// Content integrity for route posts: the schema in src/content.config.ts checks shapes at build time;
// these tests check that the data is consistent with itself and with the assets.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import cards from '../../src/data/cards.json';
import { MONTHS } from '../../src/lib/routes';

const ROUTES_DIR = 'src/content/routes';
const files = readdirSync(ROUTES_DIR).filter((f) => f.endsWith('.md') && !f.startsWith('_'));

const routes = files.map((file) => {
  const text = readFileSync(join(ROUTES_DIR, file), 'utf8');
  const [, frontmatter, body] = text.split(/^---$/m);
  return { file, data: parse(frontmatter), body };
});

const publicFile = (path: string) => join('public', path);

// Months the post doesn't classify render as "Avoid". Remove an entry once its months are filled in.
const KNOWN_MONTH_GAPS: Record<string, string[]> = {
  'iceland-golden-circle': ['Mar', 'Apr', 'Oct'],
};

describe.each(routes)('$file', ({ file, data, body }) => {
  it('has a slug that matches the file name', () => {
    expect(data.slug).toBe(file.replace(/\.md$/, ''));
  });

  it('has a hero image that exists', () => {
    expect(existsSync(publicFile(data.heroImage)), data.heroImage).toBe(true);
  });

  it('has stop images that exist', () => {
    for (const stop of data.stops) expect(existsSync(publicFile(stop.image)), stop.image).toBe(true);
  });

  it('has nights that add up across the stops, and one more day than nights', () => {
    const sum = data.stops.reduce((total: number, stop: { nights: number }) => total + stop.nights, 0);
    expect(sum).toBe(data.nights);
    expect(data.durationDays).toBe(data.nights + 1);
  });

  it('lists each month at most once across best, okay and avoid', () => {
    const all = [...data.bestMonths, ...data.okayMonths, ...data.avoidMonths];
    expect(all.length).toBe(new Set(all).size);
  });

  it('classifies every month', () => {
    const all = new Set([...data.bestMonths, ...data.okayMonths, ...data.avoidMonths]);
    const missing = MONTHS.filter((m) => !all.has(m));
    expect(missing).toEqual(KNOWN_MONTH_GAPS[data.slug] ?? []);
  });

  it('uses card names, types and rarities that match the card catalog', () => {
    let checked = 0;
    for (const stop of data.stops) {
      const card = cards.find((c) => `/${c.file}` === stop.image);
      if (!card) continue; // Cards outside the exported catalog sample can't be checked here.
      expect({ name: stop.name, type: stop.type, rarity: stop.rarity }).toEqual({ name: card.name, type: card.type, rarity: card.rarity });
      checked++;
    }
    expect(checked, 'no stop matched the card catalog').toBeGreaterThan(0);
  });

  it('has no "Collect this route" section in the body (the page renders it)', () => {
    expect(body).not.toMatch(/^## Collect this route/m);
  });

  it('has one "###" heading per stop', () => {
    expect(body.match(/^### /gm)?.length).toBe(data.stops.length);
  });
});
