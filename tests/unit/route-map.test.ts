import { describe, expect, it } from 'vitest';
import { MAP_MAX_HEIGHT, MAP_MIN_HEIGHT, MAP_WIDTH, distanceKm, projectStops, routeLengthKm } from '../../src/lib/route-map';

const tokyo = { lat: 35.6762, lng: 139.6503 };
const osaka = { lat: 34.6937, lng: 135.5023 };
const kyoto = { lat: 35.0116, lng: 135.7681 };
const fushimi = { lat: 34.9671, lng: 135.7727 };

describe('distanceKm', () => {
  it('matches the known Tokyo–Osaka distance (~400 km)', () => {
    expect(distanceKm(tokyo, osaka)).toBeGreaterThan(390);
    expect(distanceKm(tokyo, osaka)).toBeLessThan(410);
  });

  it('sums a route leg by leg', () => {
    expect(routeLengthKm([tokyo, kyoto, osaka])).toBeCloseTo(distanceKm(tokyo, kyoto) + distanceKm(kyoto, osaka), 5);
    expect(routeLengthKm([tokyo])).toBe(0);
  });
});

describe('projectStops', () => {
  const { height, points } = projectStops([tokyo, kyoto, fushimi, osaka]);

  it('keeps every pin inside the map', () => {
    for (const p of points) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(MAP_WIDTH);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(height);
    }
  });

  it('fits the map height to the route, within limits', () => {
    expect(height).toBeGreaterThanOrEqual(MAP_MIN_HEIGHT);
    expect(height).toBeLessThanOrEqual(MAP_MAX_HEIGHT);
    // A north–south route gets the tallest map.
    expect(projectStops([{ lat: 60, lng: 10 }, { lat: 40, lng: 10.5 }]).height).toBe(MAP_MAX_HEIGHT);
  });

  it('puts north up and east right', () => {
    expect(points[0].x).toBeGreaterThan(points[3].x); // Tokyo is east of Osaka
    expect(points[0].y).toBeLessThan(points[3].y); // and north of it
  });

  it('pushes stops that are almost on top of each other apart', () => {
    const [, k, f] = points;
    expect(Math.hypot(k.x - f.x, k.y - f.y)).toBeGreaterThanOrEqual(50);
  });

  it('handles a single stop and identical stops', () => {
    expect(projectStops([tokyo]).points).toHaveLength(1);
    const [a, b] = projectStops([tokyo, tokyo]).points;
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(50);
  });
});
