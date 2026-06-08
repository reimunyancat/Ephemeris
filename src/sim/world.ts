import type { Body, Vec3 } from "../core/body.js";
import {
  VelocityVerlet,
  eulerStep,
  rk4Step,
  type ForceFunc,
} from "../core/integrator.js";
import {
  naiveAccelerations,
  barnesHutAccelerations,
  testParticleAccelerations,
  totalEnergy,
  totalMomentum,
  centerOfMass,
  totalAngularMomentum,
} from "../core/gravity.js";
import { OctreePool } from "../core/octree.js";
import { makeSolarSystem } from "../data/planets.js";
import { makeAsteroidBelt, DEFAULT_BELT } from "../data/asteroidBelt.js";

export type IntegratorKind = "verlet" | "euler" | "rk4";
export type MethodKind = "naive" | "bh";
export type BeltMode = "test" | "nbody";

export class World {
  readonly core: Body[];
  belt: Body[];
  bodies: Body[];
  readonly coreCount: number;

  private readonly forcePool = new OctreePool();
  private readonly verlet = new VelocityVerlet();

  integrator: IntegratorKind = "verlet";
  method: MethodKind = "bh";
  beltMode: BeltMode = "test";
  theta = 0.5;
  dtBase = 1.0;
  dtScale = 1.0;
  stepsPerFrame = 4;
  paused = false;
  time = 0;
  beltEnabled: boolean;

  constructor(opts?: { belt?: boolean }) {
    this.core = makeSolarSystem();
    this.coreCount = this.core.length;
    this.belt = makeAsteroidBelt(DEFAULT_BELT, 1.0);
    this.beltEnabled = opts?.belt ?? false;
    this.bodies = this.beltEnabled
      ? this.core.concat(this.belt)
      : this.core.slice();
  }

  private readonly force: ForceFunc = (b) => {
    if (this.beltEnabled && this.beltMode === "test")
      return testParticleAccelerations(b, this.coreCount);
    return this.method === "bh"
      ? barnesHutAccelerations(b, this.forcePool, this.theta)
      : naiveAccelerations(b);
  };

  setBelt(on: boolean): void {
    if (on === this.beltEnabled) return;
    this.beltEnabled = on;
    this.bodies = on ? this.core.concat(this.belt) : this.core.slice();
    this.verlet.reset();
  }

  setIntegrator(kind: IntegratorKind): void {
    this.integrator = kind;
    this.verlet.reset();
  }

  setMethod(kind: MethodKind): void {
    this.method = kind;
    this.verlet.reset();
  }

  setBeltMode(kind: BeltMode): void {
    if (kind === this.beltMode) return;
    this.beltMode = kind;
    this.verlet.reset();
  }

  jumpTime(days: number): void {
    const steps = Math.max(1, Math.round(Math.abs(days) / 1.0));
    const dt = days / steps;
    this.verlet.reset();
    for (let s = 0; s < steps; s++) {
      this.verlet.step(this.bodies, this.force, dt);
      this.time += dt;
    }
    this.verlet.reset();
  }

  momentum(): Vec3 {
    return totalMomentum(this.bodies);
  }

  centerOfMass(): Vec3 {
    return centerOfMass(this.bodies);
  }

  angularMomentum(): Vec3 {
    return totalAngularMomentum(this.bodies);
  }

  step(): void {
    if (this.paused) return;
    const dt = this.dtBase * this.dtScale;
    for (let s = 0; s < this.stepsPerFrame; s++) {
      switch (this.integrator) {
        case "verlet":
          this.verlet.step(this.bodies, this.force, dt);
          break;
        case "euler":
          eulerStep(this.bodies, this.force, dt);
          break;
        case "rk4":
          rk4Step(this.bodies, this.force, dt);
          break;
      }
      this.time += dt;
    }
  }

  energy(): number {
    return totalEnergy(this.bodies);
  }
}
