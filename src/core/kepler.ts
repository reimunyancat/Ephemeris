import { TWO_PI } from "../constants.js";

export function solveKepler(
  M: number,
  e: number,
  tol = 1e-12,
  maxIter = 50,
): number {
  if (e < 0 || e >= 1) {
    throw new RangeError(`Eccentricity must be in [0,1), got ${e}`);
  }
  M = (((M % TWO_PI) + TWO_PI + Math.PI) % TWO_PI) - Math.PI;
  let E = M + e * Math.sin(M);
  for (let i = 0; i < maxIter; i++) {
    const f = E - e * Math.sin(E) - M;
    const fp = 1 - e * Math.cos(E);
    const delta = f / fp;
    E -= delta;
    if (Math.abs(delta) < tol) return E;
  }
  throw new Error(`Kepler did not converge: M=${M}, e=${e}`);
}
