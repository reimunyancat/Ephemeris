import { G } from "../constants.js";
import type { Body, Vec3 } from "./body.js";
import { OctNode, OctreePool, buildOctree } from "./octree.js";

export const EPS = 1e-5;
const EPS2 = EPS * EPS;

export function naiveAccelerations(bodies: Body[]): Vec3[] {
  const n = bodies.length;
  const acc: Vec3[] = new Array(n);
  for (let i = 0; i < n; i++) acc[i] = { x: 0, y: 0, z: 0 };

  for (let i = 0; i < n; i++) {
    const bi = bodies[i];
    for (let j = i + 1; j < n; j++) {
      const bj = bodies[j];
      const dx = bj.pos.x - bi.pos.x;
      const dy = bj.pos.y - bi.pos.y;
      const dz = bj.pos.z - bi.pos.z;
      const r2 = dx * dx + dy * dy + dz * dz + EPS2;
      const invR = 1 / Math.sqrt(r2);
      const invR3 = invR * invR * invR;
      const s = G * invR3;
      acc[i].x += s * bj.mass * dx;
      acc[i].y += s * bj.mass * dy;
      acc[i].z += s * bj.mass * dz;
      acc[j].x -= s * bi.mass * dx;
      acc[j].y -= s * bi.mass * dy;
      acc[j].z -= s * bi.mass * dz;
    }
  }
  return acc;
}

export function barnesHutAccelerations(
  bodies: Body[],
  pool: OctreePool,
  theta = 0.5,
): Vec3[] {
  const n = bodies.length;
  const acc: Vec3[] = new Array(n);
  const root = buildOctree(bodies, pool);
  const theta2 = theta * theta;
  for (let i = 0; i < n; i++) {
    const a = { x: 0, y: 0, z: 0 };
    accumulateForce(root, bodies[i], theta2, a);
    acc[i] = a;
  }
  return acc;
}

function accumulateForce(
  node: OctNode,
  b: Body,
  theta2: number,
  acc: Vec3,
): void {
  if (node.mass === 0) return;

  const dx = node.comX - b.pos.x;
  const dy = node.comY - b.pos.y;
  const dz = node.comZ - b.pos.z;
  const r2 = dx * dx + dy * dy + dz * dz;

  if (node.isLeaf() && node.body === b && node.count === 1) return;

  const s = node.size;
  if (node.isLeaf() || s * s < theta2 * r2) {
    const soft = r2 + EPS2;
    const invR = 1 / Math.sqrt(soft);
    const invR3 = invR * invR * invR;
    const f = G * node.mass * invR3;
    acc.x += f * dx;
    acc.y += f * dy;
    acc.z += f * dz;
    return;
  }

  for (let i = 0; i < 8; i++) {
    const c = node.children[i];
    if (c !== null) accumulateForce(c, b, theta2, acc);
  }
}

export function testParticleAccelerations(
  bodies: Body[],
  massiveCount: number,
): Vec3[] {
  const n = bodies.length;
  const acc: Vec3[] = new Array(n);
  for (let i = 0; i < n; i++) acc[i] = { x: 0, y: 0, z: 0 };

  for (let i = 0; i < massiveCount; i++) {
    const bi = bodies[i];
    for (let j = i + 1; j < massiveCount; j++) {
      const bj = bodies[j];
      const dx = bj.pos.x - bi.pos.x;
      const dy = bj.pos.y - bi.pos.y;
      const dz = bj.pos.z - bi.pos.z;
      const r2 = dx * dx + dy * dy + dz * dz + EPS2;
      const invR = 1 / Math.sqrt(r2);
      const invR3 = invR * invR * invR;
      const s = G * invR3;
      acc[i].x += s * bj.mass * dx;
      acc[i].y += s * bj.mass * dy;
      acc[i].z += s * bj.mass * dz;
      acc[j].x -= s * bi.mass * dx;
      acc[j].y -= s * bi.mass * dy;
      acc[j].z -= s * bi.mass * dz;
    }
  }

  for (let i = massiveCount; i < n; i++) {
    const bi = bodies[i];
    for (let j = 0; j < massiveCount; j++) {
      const bj = bodies[j];
      const dx = bj.pos.x - bi.pos.x;
      const dy = bj.pos.y - bi.pos.y;
      const dz = bj.pos.z - bi.pos.z;
      const r2 = dx * dx + dy * dy + dz * dz + EPS2;
      const invR = 1 / Math.sqrt(r2);
      const invR3 = invR * invR * invR;
      const f = G * bj.mass * invR3;
      acc[i].x += f * dx;
      acc[i].y += f * dy;
      acc[i].z += f * dz;
    }
  }
  return acc;
}

export function totalEnergy(bodies: Body[]): number {
  let ke = 0;
  let pe = 0;
  const n = bodies.length;
  for (let i = 0; i < n; i++) {
    const b = bodies[i];
    ke +=
      0.5 *
      b.mass *
      (b.vel.x * b.vel.x + b.vel.y * b.vel.y + b.vel.z * b.vel.z);
    for (let j = i + 1; j < n; j++) {
      const bj = bodies[j];
      const dx = bj.pos.x - b.pos.x;
      const dy = bj.pos.y - b.pos.y;
      const dz = bj.pos.z - b.pos.z;
      const r = Math.sqrt(dx * dx + dy * dy + dz * dz + EPS2);
      pe -= (G * b.mass * bj.mass) / r;
    }
  }
  return ke + pe;
}

export function totalMomentum(bodies: Body[]): Vec3 {
  const p = { x: 0, y: 0, z: 0 };
  for (const b of bodies) {
    p.x += b.mass * b.vel.x;
    p.y += b.mass * b.vel.y;
    p.z += b.mass * b.vel.z;
  }
  return p;
}

export function centerOfMass(bodies: Body[]): Vec3 {
  let m = 0;
  const c = { x: 0, y: 0, z: 0 };
  for (const b of bodies) {
    m += b.mass;
    c.x += b.mass * b.pos.x;
    c.y += b.mass * b.pos.y;
    c.z += b.mass * b.pos.z;
  }
  if (m > 0) {
    c.x /= m;
    c.y /= m;
    c.z /= m;
  }
  return c;
}

export function totalAngularMomentum(bodies: Body[]): Vec3 {
  const L = { x: 0, y: 0, z: 0 };
  for (const b of bodies) {
    L.x += b.mass * (b.pos.y * b.vel.z - b.pos.z * b.vel.y);
    L.y += b.mass * (b.pos.z * b.vel.x - b.pos.x * b.vel.z);
    L.z += b.mass * (b.pos.x * b.vel.y - b.pos.y * b.vel.x);
  }
  return L;
}
