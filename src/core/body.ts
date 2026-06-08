export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Body {
  name: string;
  mass: number;
  pos: Vec3;
  vel: Vec3;
  radius: number;
  color: number;
  fixed: boolean;
}

export function makeBody(
  p: Partial<Body> & { name: string; mass: number; pos: Vec3; vel: Vec3 },
): Body {
  return {
    name: p.name,
    mass: p.mass,
    pos: { ...p.pos },
    vel: { ...p.vel },
    radius: p.radius ?? 0.01,
    color: p.color ?? 0xffffff,
    fixed: p.fixed ?? false,
  };
}

export function vlen(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function vdot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function vcross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}
