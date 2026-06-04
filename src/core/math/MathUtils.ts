import type { Vec2 } from "./Vec2";
import { vec2Subtract, vec2Length, vec2Normalize } from "./Vec2";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function inverseLerp(a: number, b: number, value: number): number {
  if (a === b) return 0;
  return (value - a) / (b - a);
}

export function remap(
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number,
): number {
  const t = inverseLerp(fromMin, fromMax, value);
  return lerp(toMin, toMax, t);
}

export function distance(a: Vec2, b: Vec2): number {
  return vec2Length(vec2Subtract(a, b));
}

export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export function randomDirection(): Vec2 {
  const angle = Math.random() * Math.PI * 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

export interface WeightedItem<T> {
  item: T;
  weight: number;
}

export function weightedRandom<T>(items: WeightedItem<T>[]): T {
  const totalWeight = items.reduce((sum, entry) => sum + entry.weight, 0);
  let random = Math.random() * totalWeight;
  for (const entry of items) {
    random -= entry.weight;
    if (random <= 0) return entry.item;
  }
  return items[items.length - 1].item;
}

export function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function angleBetween(a: Vec2, b: Vec2): number {
  const diff = vec2Subtract(b, a);
  return Math.atan2(diff.y, diff.x);
}

export function moveTowards(
  current: Vec2,
  target: Vec2,
  maxDistance: number,
): Vec2 {
  const diff = vec2Subtract(target, current);
  const dist = vec2Length(diff);
  if (dist <= maxDistance) return { x: target.x, y: target.y };
  const dir = vec2Normalize(diff);
  return {
    x: current.x + dir.x * maxDistance,
    y: current.y + dir.y * maxDistance,
  };
}
