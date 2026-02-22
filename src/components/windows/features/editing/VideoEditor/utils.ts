import { ColorGrade } from './types';

export function formatTime(t: number): string {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const ms = Math.floor((t % 1) * 100);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export function buildFilterString(grade: ColorGrade): string {
  return [
    `brightness(${grade.brightness}%)`,
    `contrast(${grade.contrast}%)`,
    `saturate(${grade.saturation}%)`,
    `hue-rotate(${grade.hue}deg)`,
  ].join(' ');
}
