import { DEG2RAD, G } from "../constants.js";
import { makeBody, type Body, type Vec3 } from "../core/body.js";
import { elementsToState } from "../core/orbitalElements.js";

export interface PlanetSpec {
  name: string;
  mass: number;
  a: number;
  e: number;
  i: number;
  L: number;
  peri: number;
  node: number;
  color: number;
  radius: number;
}

export const SUN_MASS = 1.0;

export const PLANETS: PlanetSpec[] = [
  {
    name: "Mercury",
    mass: 1.6601e-7,
    a: 0.38709927,
    e: 0.20563593,
    i: 7.00497902,
    L: 252.2503235,
    peri: 77.45779628,
    node: 48.33076593,
    color: 0x9c8a78,
    radius: 0.025,
  },
  {
    name: "Venus",
    mass: 2.4478e-6,
    a: 0.72333566,
    e: 0.00677672,
    i: 3.39467605,
    L: 181.9790995,
    peri: 131.60246718,
    node: 76.67984255,
    color: 0xd9b38c,
    radius: 0.04,
  },
  {
    name: "Earth",
    mass: 3.0035e-6,
    a: 1.00000261,
    e: 0.01671123,
    i: -0.00001531,
    L: 100.46457166,
    peri: 102.93768193,
    node: 0.0,
    color: 0x4a90d9,
    radius: 0.045,
  },
  {
    name: "Mars",
    mass: 3.2272e-7,
    a: 1.52371034,
    e: 0.0933941,
    i: 1.84969142,
    L: -4.55343205,
    peri: -23.94362959,
    node: 49.55953891,
    color: 0xc1440e,
    radius: 0.035,
  },
  {
    name: "Jupiter",
    mass: 9.5479e-4,
    a: 5.202887,
    e: 0.04838624,
    i: 1.30439695,
    L: 34.39644051,
    peri: 14.72847983,
    node: 100.47390909,
    color: 0xd8a86b,
    radius: 0.12,
  },
  {
    name: "Saturn",
    mass: 2.8589e-4,
    a: 9.53667594,
    e: 0.05386179,
    i: 2.48599187,
    L: 49.95424423,
    peri: 92.59887831,
    node: 113.66242448,
    color: 0xe3c98b,
    radius: 0.1,
  },
  {
    name: "Uranus",
    mass: 4.3662e-5,
    a: 19.18916464,
    e: 0.04725744,
    i: 0.77263783,
    L: 313.23810451,
    peri: 170.9542763,
    node: 74.01692503,
    color: 0x9fd9e3,
    radius: 0.07,
  },
  {
    name: "Neptune",
    mass: 5.1514e-5,
    a: 30.06992276,
    e: 0.00859048,
    i: 1.77004347,
    L: -55.12002969,
    peri: 44.96476227,
    node: 131.78422574,
    color: 0x4b70dd,
    radius: 0.07,
  },
];

export function makeSolarSystem(): Body[] {
  const bodies: Body[] = [];
  bodies.push(
    makeBody({
      name: "Sun",
      mass: SUN_MASS,
      pos: { x: 0, y: 0, z: 0 },
      vel: { x: 0, y: 0, z: 0 },
      radius: 0.2,
      color: 0xffcc33,
    }),
  );

  for (const p of PLANETS) {
    const mu = G * (SUN_MASS + p.mass);
    const omega = (p.peri - p.node) * DEG2RAD;
    const M = (p.L - p.peri) * DEG2RAD;
    const { pos, vel } = elementsToState(
      p.a,
      p.e,
      p.i * DEG2RAD,
      p.node * DEG2RAD,
      omega,
      M,
      mu,
    );
    bodies.push(
      makeBody({
        name: p.name,
        mass: p.mass,
        pos,
        vel,
        radius: p.radius,
        color: p.color,
      }),
    );
  }

  recenterMomentum(bodies);
  return bodies;
}

export function recenterMomentum(bodies: Body[]): void {
  let mTot = 0;
  const com: Vec3 = { x: 0, y: 0, z: 0 };
  const mom: Vec3 = { x: 0, y: 0, z: 0 };
  for (const b of bodies) {
    mTot += b.mass;
    com.x += b.mass * b.pos.x;
    com.y += b.mass * b.pos.y;
    com.z += b.mass * b.pos.z;
    mom.x += b.mass * b.vel.x;
    mom.y += b.mass * b.vel.y;
    mom.z += b.mass * b.vel.z;
  }
  for (const b of bodies) {
    b.pos.x -= com.x / mTot;
    b.pos.y -= com.y / mTot;
    b.pos.z -= com.z / mTot;
    b.vel.x -= mom.x / mTot;
    b.vel.y -= mom.y / mTot;
    b.vel.z -= mom.z / mTot;
  }
}
