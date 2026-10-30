import { describe, expect, it } from 'vitest';
import { durationBucket, monthRanges, nightsLabel, sortByDate, type Route } from '../../src/lib/routes';

describe('monthRanges', () => {
  it('collapses consecutive months into ranges', () => {
    expect(monthRanges(['Mar', 'Apr', 'May', 'Oct', 'Nov'])).toBe('Mar–May, Oct–Nov');
  });

  it('keeps single months on their own', () => {
    expect(monthRanges(['May', 'Jun', 'Sep'])).toBe('May–Jun, Sep');
  });

  it('sorts months regardless of input order', () => {
    expect(monthRanges(['Aug', 'Jun', 'Jul'])).toBe('Jun–Aug');
  });

  it('returns an empty string for no months', () => {
    expect(monthRanges([])).toBe('');
  });
});

describe('nightsLabel', () => {
  it.each([
    [0, 'Day stop'],
    [1, '1 night'],
    [3, '3 nights'],
  ])('%i → %s', (nights, label) => {
    expect(nightsLabel(nights)).toBe(label);
  });
});

describe('sortByDate', () => {
  const route = (id: string, date: string) => ({ id, data: { publishedAt: new Date(date) } }) as unknown as Route;

  it('puts the newest route first without mutating the input', () => {
    const input = [route('a', '2026-01-01'), route('b', '2026-06-01'), route('c', '2026-03-01')];
    expect(sortByDate(input).map((r) => r.id)).toEqual(['b', 'c', 'a']);
    expect(input.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('durationBucket', () => {
  it.each([
    [2, 'weekend'],
    [3, 'weekend'],
    [7, '1-week'],
    [10, '1-week'],
    [11, '2-weeks'],
    [17, '2-weeks'],
    [21, '3-weeks'],
  ])('%i days → %s', (days, bucket) => {
    expect(durationBucket(days)).toBe(bucket);
  });
});
