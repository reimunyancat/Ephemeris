import type { Body, Vec3 } from "./body.js";

export type ForceFunc = (bodies: Body[]) => Vec3[];

export function eulerStep(bodies: Body[], force: ForceFunc, dt: number): void {
  const accs = force(bodies);
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    if (b.fixed) continue;
    b.pos.x += b.vel.x * dt;
    b.pos.y += b.vel.y * dt;
    b.pos.z += b.vel.z * dt;
    b.vel.x += accs[i].x * dt;
    b.vel.y += accs[i].y * dt;
    b.vel.z += accs[i].z * dt;
  }
}

export class VelocityVerlet {
  private cachedAcc: Vec3[] | null = null;
  private cachedBodies: Body[] | null = null;
  private cachedMassSum = 0;

  step(bodies: Body[], force: ForceFunc, dt: number): void {
    const n = bodies.length;

    let currentMassSum = 0;
    for (let i = 0; i < n; i++) currentMassSum += bodies[i].mass;

    const cacheValid =
      this.cachedAcc !== null &&
      this.cachedBodies === bodies &&
      this.cachedAcc.length === n &&
      Math.abs(this.cachedMassSum - currentMassSum) < 1e-12;

    const a0 = cacheValid ? this.cachedAcc! : force(bodies);

    for (let i = 0; i < n; i++) {
      const b = bodies[i];
      if (b.fixed) continue;
      b.pos.x += b.vel.x * dt + 0.5 * a0[i].x * dt * dt;
      b.pos.y += b.vel.y * dt + 0.5 * a0[i].y * dt * dt;
      b.pos.z += b.vel.z * dt + 0.5 * a0[i].z * dt * dt;
    }
    const a1 = force(bodies);
    for (let i = 0; i < n; i++) {
      const b = bodies[i];
      if (b.fixed) continue;
      b.vel.x += 0.5 * (a0[i].x + a1[i].x) * dt;
      b.vel.y += 0.5 * (a0[i].y + a1[i].y) * dt;
      b.vel.z += 0.5 * (a0[i].z + a1[i].z) * dt;
    }
    this.cachedAcc = a1;
    this.cachedBodies = bodies;
    this.cachedMassSum = currentMassSum;
  }

  reset(): void {
    this.cachedAcc = null;
    this.cachedBodies = null;
    this.cachedMassSum = 0;
  }
}

export function rk4Step(bodies: Body[], force: ForceFunc, dt: number): void {
  const n = bodies.length;
  const pos0 = bodies.map((b) => ({ x: b.pos.x, y: b.pos.y, z: b.pos.z }));
  const vel0 = bodies.map((b) => ({ x: b.vel.x, y: b.vel.y, z: b.vel.z }));

  const evalAt = (p: Vec3[]): Vec3[] => {
    for (let i = 0; i < n; i++) {
      if (bodies[i].fixed) continue;
      bodies[i].pos.x = p[i].x;
      bodies[i].pos.y = p[i].y;
      bodies[i].pos.z = p[i].z;
    }
    return force(bodies);
  };

  const add = (p: Vec3[], v: Vec3[], h: number): Vec3[] =>
    p.map((pi, i) => ({
      x: pi.x + h * v[i].x,
      y: pi.y + h * v[i].y,
      z: pi.z + h * v[i].z,
    }));

  const k1v = vel0,
    k1a = evalAt(pos0);
  const k2v = add(vel0, k1a, 0.5 * dt),
    k2a = evalAt(add(pos0, k1v, 0.5 * dt));
  const k3v = add(vel0, k2a, 0.5 * dt),
    k3a = evalAt(add(pos0, k2v, 0.5 * dt));
  const k4v = add(vel0, k3a, dt),
    k4a = evalAt(add(pos0, k3v, dt));

  for (let i = 0; i < n; i++) {
    if (bodies[i].fixed) {
      bodies[i].pos.x = pos0[i].x;
      bodies[i].pos.y = pos0[i].y;
      bodies[i].pos.z = pos0[i].z;
      bodies[i].vel.x = vel0[i].x;
      bodies[i].vel.y = vel0[i].y;
      bodies[i].vel.z = vel0[i].z;
      continue;
    }
    bodies[i].pos.x =
      pos0[i].x +
      (dt / 6) * (k1v[i].x + 2 * k2v[i].x + 2 * k3v[i].x + k4v[i].x);
    bodies[i].pos.y =
      pos0[i].y +
      (dt / 6) * (k1v[i].y + 2 * k2v[i].y + 2 * k3v[i].y + k4v[i].y);
    bodies[i].pos.z =
      pos0[i].z +
      (dt / 6) * (k1v[i].z + 2 * k2v[i].z + 2 * k3v[i].z + k4v[i].z);
    bodies[i].vel.x =
      vel0[i].x +
      (dt / 6) * (k1a[i].x + 2 * k2a[i].x + 2 * k3a[i].x + k4a[i].x);
    bodies[i].vel.y =
      vel0[i].y +
      (dt / 6) * (k1a[i].y + 2 * k2a[i].y + 2 * k3a[i].y + k4a[i].y);
    bodies[i].vel.z =
      vel0[i].z +
      (dt / 6) * (k1a[i].z + 2 * k2a[i].z + 2 * k3a[i].z + k4a[i].z);
  }
}
