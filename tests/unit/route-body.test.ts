import { describe, expect, it } from 'vitest';
import { splitRouteBody } from '../../src/lib/route-body';

const html = `<p>Intro.</p>
<h2 id="when">When to go</h2>
<p>Spring.</p>
<h2 id="route">The route, stop by stop</h2>
<h3 id="1">1 · Tokyo — 3 nights</h3>
<p>Big city.<br>
<strong>Tip:</strong> get an IC card.</p>
<h3 id="2">2 · Mount Fuji — day stop</h3>
<p>Volcano.</p>
<h2 id="tips">Practical tips</h2>
<ul><li>Rail</li></ul>`;

describe('splitRouteBody', () => {
  const segments = splitRouteBody(html);

  it('numbers the stop sections in order', () => {
    const stops = segments.filter((s) => s.kind === 'stop');
    expect(stops.map((s) => s.kind === 'stop' && s.index)).toEqual([0, 1]);
    expect(stops[0].html).toContain('Tokyo');
    expect(stops[1].html).toContain('Mount Fuji');
  });

  it('keeps everything else, in order, and loses nothing', () => {
    expect(segments.map((s) => s.kind)).toEqual(['html', 'html', 'html', 'stop', 'stop', 'html']);
    expect(segments.map((s) => s.html).join('').replace('</p><p class="tip">', '<br>\n')).toBe(html);
  });

  it('turns "Tip:" lines into their own paragraph', () => {
    expect(segments[3].html).toContain('<p class="tip"><strong>Tip:</strong> get an IC card.</p>');
  });
});
