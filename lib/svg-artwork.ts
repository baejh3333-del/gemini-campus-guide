const prefix = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">';
const legacyPrefix = prefix.replace('stroke-width="1.5"', 'stroke-width="2.5"');
const suffix = "</svg>";
const dataPrefix = "data:image/svg+xml;base64,";
const pathPattern = /<path d="[Mm][MmZzLlHhVvCcSsQqTtAa0-9., +\-]{1,700}" fill="(?:none|#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?)" stroke="(?:none|#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?)"\/>/y;

export function validateSvgArtwork(artwork: string) {
  if (!artwork.startsWith(dataPrefix) || artwork.length > 20000) return false;
  const encoded = artwork.slice(dataPrefix.length);
  const bytes = Buffer.from(encoded, "base64");
  if (bytes.toString("base64") !== encoded) return false;
  const svg = bytes.toString("utf8");
  if ((!svg.startsWith(prefix) && !svg.startsWith(legacyPrefix)) || !svg.endsWith(suffix)) return false;
  const paths = svg.slice(prefix.length, -suffix.length);
  pathPattern.lastIndex = 0;
  for (let count = 1; count <= 24; count++) {
    if (!pathPattern.test(paths)) return false;
    if (pathPattern.lastIndex === paths.length) return true;
  }
  return false;
}

export function createSvgArtwork(paths: { d: string; fill: string; stroke: string }[]) {
  const svg = prefix + paths.map(({ d, fill, stroke }) =>
    `<path d="${d}" fill="${fill}" stroke="${stroke}"/>`
  ).join("") + suffix;
  const artwork = dataPrefix + Buffer.from(svg).toString("base64");
  if (!validateSvgArtwork(artwork)) throw new Error("Invalid SVG artwork");
  return artwork;
}
