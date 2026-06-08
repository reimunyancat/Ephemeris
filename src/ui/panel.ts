import { RAD2DEG } from "../constants.js";
import { stateToElements } from "../core/orbitalElements.js";
import { G } from "../constants.js";
import { SUN_MASS } from "../data/planets.js";
import type { World } from "../sim/world.js";

export class Panel {
  private readonly el: HTMLElement;
  private readonly fpsEl: HTMLElement;
  private readonly statEl: HTMLElement;
  private readonly consEl: HTMLElement;
  private readonly orbEl: HTMLElement;
  selected = -1;

  constructor(root: HTMLElement) {
    this.el = root;
    this.el.innerHTML = `
      <div class="hud-title">Ephemeris — Solar System N-body (3D)</div>
      <div id="hud-fps" class="hud-row"></div>
      <div id="hud-stat" class="hud-row"></div>
      <div id="hud-cons" class="hud-row"></div>
      <div id="hud-orbit" class="hud-orbit"></div>
      <div class="hud-help">
        [Space] 일시정지 · [←/→] 속도 · [B] 소행성대 · [M] 질량모드 · [O] 옥트리 · [T] 궤적<br>
        [1]Verlet [2]Euler [3]RK4 · [N] 직접↔BH · [ [ / ] ] 시간 점프(∓1년) · 행성 더블클릭=추적
      </div>`;
    this.fpsEl = this.el.querySelector("#hud-fps")!;
    this.statEl = this.el.querySelector("#hud-stat")!;
    this.consEl = this.el.querySelector("#hud-cons")!;
    this.orbEl = this.el.querySelector("#hud-orbit")!;
  }

  update(world: World, fps: number, bodyCount: number): void {
    const years = (world.time / 365.25).toFixed(2);
    this.fpsEl.textContent = `FPS ${fps.toFixed(0)}  ·  bodies ${bodyCount}  ·  t = ${years} yr`;
    const dir = world.dtScale < 0 ? "◀" : "▶";
    this.statEl.textContent =
      `${world.paused ? "⏸ paused" : dir + " ×" + Math.abs(world.dtScale).toFixed(1)}` +
      `  ·  ${world.integrator}  ·  ${world.method === "bh" ? "Barnes-Hut θ=" + world.theta : "naive O(N²)"}` +
      `${world.beltEnabled ? "  ·  belt:" + (world.beltMode === "test" ? "test-particle" : "N-body") : ""}`;

    const mag = (v: { x: number; y: number; z: number }) =>
      Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    this.consEl.textContent =
      `E ${world.energy().toExponential(3)} · |p| ${mag(world.momentum()).toExponential(2)}` +
      ` · |L| ${mag(world.angularMomentum()).toExponential(3)} · |COM| ${mag(world.centerOfMass()).toExponential(2)} AU`;

    if (this.selected > 0 && this.selected < world.coreCount) {
      const sun = world.core[0];
      const b = world.core[this.selected];
      const rel = {
        x: b.pos.x - sun.pos.x,
        y: b.pos.y - sun.pos.y,
        z: b.pos.z - sun.pos.z,
      };
      const vrel = {
        x: b.vel.x - sun.vel.x,
        y: b.vel.y - sun.vel.y,
        z: b.vel.z - sun.vel.z,
      };
      const mu = G * (SUN_MASS + b.mass);
      const el = stateToElements(rel, vrel, mu);
      this.orbEl.innerHTML =
        `<b>${b.name}</b><br>` +
        `a = ${el.a.toFixed(4)} AU<br>` +
        `e = ${el.e.toFixed(4)}<br>` +
        `i = ${(el.i * RAD2DEG).toFixed(3)}°<br>` +
        `Ω = ${(el.Omega * RAD2DEG).toFixed(2)}°<br>` +
        `ω = ${(el.omega * RAD2DEG).toFixed(2)}°<br>` +
        `M = ${(el.M * RAD2DEG).toFixed(2)}°`;
    } else {
      this.orbEl.innerHTML = `<span class="hud-dim">행성을 더블클릭하면 궤도요소가 표시됩니다.</span>`;
    }
  }
}
