import { DEG2RAD, G, TWO_PI } from "../constants.js";
import { makeBody, type Body } from "../core/body.js";
import { elementsToState } from "../core/orbitalElements.js";

export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BeltOptions {
  count: number;
  aMin: number;
  aMax: number;
  seed: number;
  mass: number;
  inclMax: number;
}

export const DEFAULT_BELT: BeltOptions = {
  count: 800,
  aMin: 2.2,
  aMax: 3.3,
  seed: 1234,
  mass: 1e-15,
  inclMax: 12,
};

export function makeAsteroidBelt(opts: BeltOptions, centralMass = 1.0): Body[] {
  const rand = mulberry32(opts.seed);
  const mu = G * centralMass;
  const out: Body[] = [];
  for (let k = 0; k < opts.count; k++) {
    const a = opts.aMin + rand() * (opts.aMax - opts.aMin);
    const e = rand() * 0.1;
    const i = rand() * opts.inclMax * DEG2RAD;
    const Omega = rand() * TWO_PI;
    const omega = rand() * TWO_PI;
    const M = rand() * TWO_PI;
    const { pos, vel } = elementsToState(a, e, i, Omega, omega, M, mu);
    out.push(
      makeBody({
        name: `ast-${k}`,
        mass: opts.mass,
        pos,
        vel,
        radius: 0.006,
        color: 0x888888,
      }),
    );
  }
  return out;
}
