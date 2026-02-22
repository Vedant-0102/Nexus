import { FilterType } from './types';

export function floodFill(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  fillColor: string,
  w: number,
  h: number,
  tolerance: number = 30
): void {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const tx = Math.floor(sx);
  const ty = Math.floor(sy);
  if (tx < 0 || tx >= w || ty < 0 || ty >= h) return;

  const idx = (ty * w + tx) * 4;
  const targetR = data[idx];
  const targetG = data[idx + 1];
  const targetB = data[idx + 2];
  const targetA = data[idx + 3];

  const hex = fillColor.replace('#', '');
  const fillR = parseInt(hex.slice(0, 2), 16);
  const fillG = parseInt(hex.slice(2, 4), 16);
  const fillB = parseInt(hex.slice(4, 6), 16);

  if (targetR === fillR && targetG === fillG && targetB === fillB && targetA === 255) return;

  const stack: [number, number][] = [[tx, ty]];
  const visited = new Set<number>();

  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!;
    const ci = (cy * w + cx) * 4;
    if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
    if (visited.has(cy * w + cx)) continue;
    if (
      Math.abs(data[ci] - targetR) > tolerance ||
      Math.abs(data[ci + 1] - targetG) > tolerance ||
      Math.abs(data[ci + 2] - targetB) > tolerance ||
      Math.abs(data[ci + 3] - targetA) > tolerance
    ) continue;

    visited.add(cy * w + cx);
    data[ci] = fillR;
    data[ci + 1] = fillG;
    data[ci + 2] = fillB;
    data[ci + 3] = 255;

    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }

  ctx.putImageData(imageData, 0, 0);
}

export function applyImageFilter(
  ctx: CanvasRenderingContext2D,
  filter: FilterType,
  canvasW: number,
  canvasH: number,
  value?: number
): void {
  const imageData = ctx.getImageData(0, 0, canvasW, canvasH);
  const d = imageData.data;
  const v = value ?? 0;

  switch (filter) {
    case 'grayscale':
      for (let i = 0; i < d.length; i += 4) {
        const avg = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
        d[i] = d[i + 1] = d[i + 2] = avg;
      }
      break;

    case 'sepia':
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        d[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        d[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        d[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      }
      break;

    case 'invert':
      for (let i = 0; i < d.length; i += 4) {
        d[i] = 255 - d[i];
        d[i + 1] = 255 - d[i + 1];
        d[i + 2] = 255 - d[i + 2];
      }
      break;

    case 'brightness':
      for (let i = 0; i < d.length; i += 4) {
        d[i] = Math.min(255, Math.max(0, d[i] + v));
        d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + v));
        d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + v));
      }
      break;

    case 'contrast': {
      const f = (259 * (v + 255)) / (255 * (259 - v));
      for (let i = 0; i < d.length; i += 4) {
        d[i] = Math.min(255, Math.max(0, f * (d[i] - 128) + 128));
        d[i + 1] = Math.min(255, Math.max(0, f * (d[i + 1] - 128) + 128));
        d[i + 2] = Math.min(255, Math.max(0, f * (d[i + 2] - 128) + 128));
      }
      break;
    }

    case 'blur': {
      const w = canvasW, h = canvasH;
      const copy = new Uint8ClampedArray(d);
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          for (let c = 0; c < 3; c++) {
            let sum = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                sum += copy[((y + ky) * w + (x + kx)) * 4 + c];
              }
            }
            d[(y * w + x) * 4 + c] = sum / 9;
          }
        }
      }
      break;
    }

    case 'sharpen': {
      const w = canvasW, h = canvasH;
      const copy = new Uint8ClampedArray(d);
      const k = [0, -1, 0, -1, 5, -1, 0, -1, 0];
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          for (let c = 0; c < 3; c++) {
            let sum = 0, ki = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                sum += copy[((y + ky) * w + (x + kx)) * 4 + c] * k[ki++];
              }
            }
            d[(y * w + x) * 4 + c] = Math.min(255, Math.max(0, sum));
          }
        }
      }
      break;
    }

    case 'posterize': {
      const levels = Math.max(2, Math.min(16, v || 4));
      const step = 255 / (levels - 1);
      for (let i = 0; i < d.length; i += 4) {
        d[i] = Math.round(d[i] / step) * step;
        d[i + 1] = Math.round(d[i + 1] / step) * step;
        d[i + 2] = Math.round(d[i + 2] / step) * step;
      }
      break;
    }

    case 'pixelate': {
      const size = Math.max(2, v || 8);
      const w = canvasW, h = canvasH;
      for (let y = 0; y < h; y += size) {
        for (let x = 0; x < w; x += size) {
          const pidx = (y * w + x) * 4;
          const r = d[pidx], g = d[pidx + 1], b = d[pidx + 2];
          for (let dy = 0; dy < size && y + dy < h; dy++) {
            for (let dx = 0; dx < size && x + dx < w; dx++) {
              const pi = ((y + dy) * w + (x + dx)) * 4;
              d[pi] = r;
              d[pi + 1] = g;
              d[pi + 2] = b;
            }
          }
        }
      }
      break;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

export function createCanvas(width: number, height: number, fillStyle?: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  if (fillStyle) {
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = fillStyle;
    ctx.fillRect(0, 0, width, height);
  }
  return c;
}
