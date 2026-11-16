import { paletteColour } from './palette.js';

const SIZE = 280;
const CELL = 5;
const GRID = SIZE / CELL;

function seeded(index) {
  const value = Math.sin(index * 127.1 + 31.7) * 43758.5453;
  return value - Math.floor(value);
}

export async function loadPixelScene(scene) {
  const image = new Image();
  image.src = scene.src || `data:image/svg+xml;charset=utf-8,${encodeURIComponent(scene.svg)}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d', {willReadFrequently: true});
  ctx.drawImage(image, 22, 22, SIZE - 44, SIZE - 44);
  const pixels = ctx.getImageData(0, 0, SIZE, SIZE).data;
  const mask = Array.from({length: GRID}, () => Array(GRID).fill(false));
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      mask[y][x] = [[1, 1], [3, 1], [1, 3], [3, 3]].some(([dx, dy]) => {
        const index = ((y * CELL + dy) * SIZE + x * CELL + dx) * 4;
        return pixels[index + 3] > 120 && pixels[index] < 150;
      });
    }
  }
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = '#000';
  const points = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!mask[y][x]) continue;
      const px = x * CELL;
      const py = y * CELL;
      const seed = x * 73 + y * 193;
      const angle = Math.atan2(py + CELL / 2 - SIZE / 2, px + CELL / 2 - SIZE / 2);
      const radius = 45 + seeded(seed + 4) * 45;
      const edge = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dy]) => !mask[y + dy]?.[x + dx]);
      points.push({
        x: px, y: py, edge,
        colourIndex: (x * .55 + y * .8) / 9,
        scatterX: 12 + seeded(seed) * 251,
        scatterY: 12 + seeded(seed + 1) * 251,
        delay: seeded(seed + 2) * .18,
        size: CELL * (.65 + seeded(seed + 3) * .35),
        radialX: Math.cos(angle) * radius,
        radialY: Math.sin(angle) * radius,
      });
      ctx.fillRect(px, py, CELL, CELL);
    }
  }
  return {...scene, points, shapeUrl: canvas.toDataURL('image/png')};
}

export function drawPixelScene(ctx, scene, progress, {pointer = null, pulse = 0, time = 0} = {}) {
  progress = Math.max(0, Math.min(1, progress));
  pulse = Math.max(0, Math.min(1, pulse));
  ctx.save();
  ctx.clearRect(0, 0, SIZE, SIZE);
  for (const point of scene.points) {
    ctx.fillStyle = paletteColour(point.colourIndex, time);
    const amount = Math.max(0, (progress - point.delay) / (1 - point.delay));
    const eased = 1 - (1 - amount) ** 3;
    let x = point.scatterX + (point.x - point.scatterX) * eased + point.radialX * pulse;
    let y = point.scatterY + (point.y - point.scatterY) * eased + point.radialY * pulse;
    if (pointer) {
      const dx = x + CELL / 2 - pointer.x;
      const dy = y + CELL / 2 - pointer.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 70) {
        const force = (1 - distance / 70) ** 2 * 34 * (pointer.strength ?? 1);
        const angle = distance ? Math.atan2(dy, dx) : Math.atan2(point.radialY, point.radialX);
        x += Math.cos(angle) * force;
        y += Math.sin(angle) * force;
      }
    }
    ctx.globalAlpha = .18 + amount * .82;
    if (point.edge) {
      ctx.fillRect(x, y, point.size, point.size);
    } else {
      ctx.beginPath();
      ctx.arc(x + CELL / 2, y + CELL / 2, .8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
