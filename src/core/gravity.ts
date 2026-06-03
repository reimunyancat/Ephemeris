import { Body, vec } from "./body";
import { G } from "../constants";

const SOFTENING = 1e-4;

export function computeAccelerations(
  bodies: Body[],
  softening = SOFTENING,
): void {
  for (const b of bodies) b.acc = vec();

  const eps2 = softening * softening;
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i];
      const b = bodies[j];

      const dx = b.pos.x - a.pos.x;
      const dy = b.pos.y - a.pos.y;
      const dz = b.pos.z - b.pos.z;

      const dist2 = dx * dx + dy * dy + dz * dz + eps2;
      const invDist = 1 / Math.sqrt(dist2);
      const invDist3 = invDist * invDist * invDist;

      const sa = G * b.mass * invDist3;
      a.acc.x += sa * dx;
      a.acc.y += sa * dy;
      a.acc.z += sa * dz;

      const sb = G * a.mass * invDist3;
      b.acc.x -= sb * dx;
      b.acc.y -= sb * dy;
      b.acc.z -= sb * dz;
    }
  }
}
