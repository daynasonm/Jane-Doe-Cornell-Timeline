import { paletteColour } from './palette.js';

export function createPixelMessage(canvas, text, {
  width = 800, fontSize = 88, cell = 2, fontFamily = 'Caslon, Georgia, serif',
  dpr = Math.min(globalThis.devicePixelRatio || 1, 2),
} = {}) {
  width = Math.round(width);
  const padding = 14;
  const mask = document.createElement('canvas');
  const ink = mask.getContext('2d', { willReadFrequently: true });
  ink.font = `${fontSize}px ${fontFamily}`;
  const availableWidth = width - padding * 2;
  const minimumSize = Math.min(52, fontSize);
  const fittedSize = fontSize * Math.min(1, availableWidth / Math.max(1, ink.measureText(text).width));
  let lines = [text];
  if (fittedSize < minimumSize) {
    fontSize = minimumSize;
    ink.font = `${fontSize}px ${fontFamily}`;
    const words = text.trim().split(/\s+/);
    const longestWord = Math.max(...words.map(word => ink.measureText(word).width));
    fontSize *= Math.min(1, availableWidth / Math.max(1, longestWord));
    ink.font = `${fontSize}px ${fontFamily}`;
    lines = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && ink.measureText(candidate).width > availableWidth) {
        lines.push(line);
        line = word;
      } else line = candidate;
    }
    lines.push(line);
  } else fontSize = fittedSize;
  ink.font = `${fontSize}px ${fontFamily}`;
  const metrics = ink.measureText(text);
  const ascent = metrics.actualBoundingBoxAscent || fontSize * .8;
  const descent = metrics.actualBoundingBoxDescent || fontSize * .25;
  const lineHeight = fontSize * 1.15;
  const height = Math.ceil(ascent + descent + (lines.length - 1) * lineHeight + padding * 2);
  mask.width = width;
  mask.height = height;
  ink.font = `${fontSize}px ${fontFamily}`;
  ink.textAlign = 'center';
  lines.forEach((line, index) => ink.fillText(line, width / 2, padding + ascent + index * lineHeight));
  const pixels = ink.getImageData(0, 0, width, height).data;
  const points = [];
  for (let y = 0; y < height; y += cell) {
    for (let x = 0; x < width; x += cell) {
      let covered = false;
      for (let py = Math.floor(y); py < Math.min(height, y + cell); py++) {
        for (let px = Math.floor(x); px < Math.min(width, x + cell); px++) {
          if (pixels[(py * width + px) * 4 + 3] > 40) covered = true;
        }
      }
      if (!covered) continue;
      const seed = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      const grain = seed - Math.floor(seed);
      points.push({ x, y, size: cell * (.82 + grain * .14), grain,
        colour: x / width * 9 + y / height * 1.4 + grain * .25 });
    }
  }
  dpr = Math.max(1, Math.min(2, dpr));
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height, fontSize, draw(time, progress = 1) {
    progress = Math.max(0, Math.min(1, progress));
    const drift = (1 - progress) ** 3;
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = .75 + progress * .25;
    ctx.fillStyle = '#080808';
    for (const point of points) {
      const x = point.x + (point.grain - .5) * 16 * drift;
      const y = point.y + Math.sin(point.x + point.y) * 6 * drift;
      ctx.fillRect(x - 1.2, y - 1.2, point.size + 2.4, point.size + 2.4);
    }
    for (const point of points) {
      ctx.fillStyle = paletteColour(point.colour, time);
      ctx.fillRect(point.x + (point.grain - .5) * 16 * drift,
        point.y + Math.sin(point.x + point.y) * 6 * drift, point.size, point.size);
    }
    ctx.globalAlpha = 1;
  } };
}
