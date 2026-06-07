import { Body } from "./body";
import { computeAccelerations } from "./gravity";

export function velocityVerletStep(bodies: Body[], dt: number): void {
  const halfDt2 = 0.5 * dt * dt;
  for (const b of bodies) {
    b.pos.x += b.vel.x * dt + b.acc.x * halfDt2;
    b.pos.y += b.vel.y * dt + b.acc.y * halfDt2;
    b.pos.z += b.vel.z * dt + b.acc.z * halfDt2;
  }

  const oldAcc = bodies.map((b) => ({ x: b.acc.x, y: b.acc.y, z: b.acc.z }));
  computeAccelerations(bodies);

  const halfDt = 0.5 * dt;
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    b.vel.x += (oldAcc[i].x + b.acc.x) * halfDt;
    b.vel.y += (oldAcc[i].y + b.acc.y) * halfDt;
    b.vel.z += (oldAcc[i].z + b.acc.z) * halfDt;
  }
}
