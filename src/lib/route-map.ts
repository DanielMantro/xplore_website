// Schematic route map, computed at build time: no map tiles, no third-party requests.

export interface MapStop {
  lat: number;
  lng: number;
}

export const MAP_WIDTH = 1000;
/** Height follows the route's shape: flat routes get a short map, tall ones up to MAP_MAX_HEIGHT. */
export const MAP_MIN_HEIGHT = 300;
export const MAP_MAX_HEIGHT = 560;
const PADDING = 80;
/** Minimum distance between pins, in map units (pins are ~30px on a ~1000px-wide map). */
const MIN_GAP = 52;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in km. */
export function distanceKm(a: MapStop, b: MapStop): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Straight-line length of the route from stop to stop. */
export function routeLengthKm(stops: MapStop[]): number {
  return stops.slice(1).reduce((km, stop, i) => km + distanceKm(stops[i], stop), 0);
}

/**
 * Projects stops into a MAP_WIDTH-wide box (equirectangular, corrected for latitude, north up),
 * then nudges pins that would overlap — e.g. Kyoto and Fushimi Inari, 5 km apart — until they're readable.
 */
export function projectStops(stops: MapStop[]): { height: number; points: { x: number; y: number }[] } {
  if (stops.length === 0) return { height: MAP_MIN_HEIGHT, points: [] };
  const k = Math.cos(toRad(stops.reduce((sum, s) => sum + s.lat, 0) / stops.length));
  const raw = stops.map((s) => ({ x: s.lng * k, y: -s.lat }));
  const xs = raw.map((p) => p.x);
  const ys = raw.map((p) => p.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const scale = Math.min((MAP_WIDTH - 2 * PADDING) / spanX, (MAP_MAX_HEIGHT - 2 * PADDING) / spanY);
  const height = Math.round(Math.min(MAP_MAX_HEIGHT, Math.max(MAP_MIN_HEIGHT, spanY * scale + 2 * PADDING)));
  const offsetX = (MAP_WIDTH - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;
  const points = raw.map((p) => ({ x: offsetX + (p.x - minX) * scale, y: offsetY + (p.y - minY) * scale }));

  for (let round = 0; round < 200; round++) {
    let moved = false;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i];
        const b = points[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.hypot(dx, dy);
        if (dist >= MIN_GAP) continue;
        if (dist < 0.01) [dx, dy, dist] = [1, 0.6, Math.hypot(1, 0.6)]; // identical points: push apart diagonally
        const push = (MIN_GAP - dist) / 2;
        a.x -= (dx / dist) * push;
        a.y -= (dy / dist) * push;
        b.x += (dx / dist) * push;
        b.y += (dy / dist) * push;
        moved = true;
      }
    }
    for (const p of points) {
      p.x = Math.min(MAP_WIDTH - 30, Math.max(30, p.x));
      p.y = Math.min(height - 30, Math.max(30, p.y));
    }
    if (!moved) break;
  }
  return { height, points: points.map((p) => ({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 })) };
}
