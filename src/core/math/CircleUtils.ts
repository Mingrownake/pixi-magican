import type { Vec2 } from "./Vec2";
import { vec2DistanceSquared } from "./Vec2";

export interface Circle {
  center: Vec2;
  radius: number;
}

export function circlesOverlap(a: Circle, b: Circle): boolean {
  const combinedRadius = a.radius + b.radius;
  return (
    vec2DistanceSquared(a.center, b.center) <= combinedRadius * combinedRadius
  );
}

export function pointInCircle(point: Vec2, circle: Circle): boolean {
  return (
    vec2DistanceSquared(point, circle.center) <= circle.radius * circle.radius
  );
}

export function circleContainsCircle(outer: Circle, inner: Circle): boolean {
  const distSq = vec2DistanceSquared(outer.center, inner.center);
  const radiusDiff = outer.radius - inner.radius;
  return radiusDiff >= 0 && distSq <= radiusDiff * radiusDiff;
}

export function closestPointOnCircle(point: Vec2, circle: Circle): Vec2 {
  const dx = point.x - circle.center.x;
  const dy = point.y - circle.center.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0)
    return { x: circle.center.x + circle.radius, y: circle.center.y };
  const scale = circle.radius / dist;
  return { x: circle.center.x + dx * scale, y: circle.center.y + dy * scale };
}
