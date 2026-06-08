import { solveKepler } from "../data/kepler";
import { Vec3 } from "./body";

export function elementsToState(
  a: number,
  e: number,
  i: number,
  Omega: number,
  omega: number,
  M: number,
  mu: number,
): { pos: Vec3; vel: Vec3 } {
  const E = solveKepler(M, e);
  const cE = Math.cos(E);
  const sE = Math.sin(E);
  const sq = Math.sqrt(1 - e * e);

  const xP = a * (cE - e);
  const yP = a * sq * sE;
  const n = Math.sqrt(mu / (a * a * a));
  const Edot = n / (1 - e * cE);
  const vxP = -a * sE * Edot;
  const vyP = a * sq * cE * Edot;

  const cO = Math.cos(Omega),
    sO = Math.sin(Omega);
  const ci = Math.cos(i),
    si = Math.sin(i);
  const cw = Math.cos(omega),
    sw = Math.sin(omega);

  const R11 = cO * cw - sO * sw * ci;
  const R12 = -cO * sw - sO * cw * ci;
  const R21 = sO * cw + cO * sw * ci;
  const R22 = -sO * sw + cO * cw * ci;
  const R31 = sw * si;
  const R32 = cw * si;

  const pos: Vec3 = {
    x: R11 * xP + R12 * yP,
    y: R21 * xP + R22 * yP,
    z: R31 * xP + R32 * yP,
  };
  const vel: Vec3 = {
    x: R11 * vxP + R12 * vyP,
    y: R21 * vxP + R22 * vyP,
    z: R31 * vxP + R32 * vyP,
  };
  return { pos, vel };
}

export function stateToElements(
  pos: Vec3,
  vel: Vec3,
  mu: number,
): OrbitalElements {
  const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
  const v2 = vel.x * vel.x + vel.y * vel.y + vel.z * vel.z;

  const hx = pos.y * vel.z - pos.z * vel.y;
  const hy = pos.z * vel.x - pos.x * vel.z;
  const hz = pos.x * vel.y - pos.y * vel.x;
  const h = Math.sqrt(hx * hx + hy * hy + hz * hz);

  const nx = -hy;
  const ny = hx;
  const nMag = Math.sqrt(nx * nx + ny * ny);

  const rv = pos.x * vel.x + pos.y * vel.y + pos.z * vel.z;
  const c1 = v2 - mu / r;
  const ex = (c1 * pos.x - rv * vel.x) / mu;
  const ey = (c1 * pos.y - rv * vel.y) / mu;
  const ez = (c1 * pos.z - rv * vel.z) / mu;
  const e = Math.sqrt(ex * ex + ey * ey + ez * ez);

  const energy = 0.5 * v2 - mu / r;
  const a = Math.abs(energy) < 1e-15 ? Infinity : -mu / (2 * energy);
  const i = Math.acos(clamp(hz / h, -1, 1));

  let Omega: number;
  let omega: number;
  let nu: number;

  if (nMag > EQ_EPS) {
    Omega = Math.acos(clamp(nx / nMag, -1, 1));
    if (ny < 0) Omega = TWO_PI - Omega;
  } else {
    Omega = 0;
  }

  if (e > CIRC_EPS) {
    if (nMag > EQ_EPS) {
      omega = Math.acos(clamp((nx * ex + ny * ey) / (nMag * e), -1, 1));
      if (ez < 0) omega = TWO_PI - omega;
    } else {
      omega = norm2pi(Math.atan2(ey, ex) * (hz < 0 ? -1 : 1));
    }
    nu = Math.acos(
      clamp((ex * pos.x + ey * pos.y + ez * pos.z) / (e * r), -1, 1),
    );
    if (rv < 0) nu = TWO_PI - nu;
  } else {
    omega = 0;
    if (nMag > EQ_EPS) {
      nu = Math.acos(clamp((nx * pos.x + ny * pos.y) / (nMag * r), -1, 1));
      if (pos.z < 0) nu = TWO_PI - nu;
    } else {
      nu = norm2pi(Math.atan2(pos.y, pos.x));
    }
  }

  let E = 0;
  let M = 0;
  if (e < 1) {
    E =
      2 *
      Math.atan2(
        Math.sqrt(1 - e) * Math.sin(nu / 2),
        Math.sqrt(1 + e) * Math.cos(nu / 2),
      );
    M = E - e * Math.sin(E);
    E = norm2pi(E);
    M = norm2pi(M);
  }

  return { a, e, i, Omega, omega, nu, E, M };
}
