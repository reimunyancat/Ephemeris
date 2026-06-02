export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export const vec = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });

export class Body {
  name: string;
  mass: number; // 질량 (M☉)
  pos: Vec3;
  vel: Vec3;
  acc: Vec3 = vec();

  constructor(name: string, mass: number, pos: Vec3, vel: Vec3) {
    this.name = name;
    this.mass = mass;
    this.pos = pos;
    this.vel = vel;
  }
}
