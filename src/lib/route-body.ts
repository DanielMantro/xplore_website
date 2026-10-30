// Splits a route post's rendered HTML so the page can put each stop's card beside its "###" section.

export type BodySegment = { kind: 'html'; html: string } | { kind: 'stop'; index: number; html: string };

/** Stand-alone "Tip:" paragraphs, so they can be styled as callouts. */
function separateTips(html: string): string {
  return html.replace(/<br\s*\/?>\s*<strong>Tip:<\/strong>/g, '</p><p class="tip"><strong>Tip:</strong>');
}

export function splitRouteBody(html: string): BodySegment[] {
  let stop = 0;
  return separateTips(html)
    .split(/(?=<h[23][\s>])/)
    .filter((chunk) => chunk.trim())
    .map((chunk) => (chunk.startsWith('<h3') ? { kind: 'stop', index: stop++, html: chunk } : { kind: 'html', html: chunk }));
}
