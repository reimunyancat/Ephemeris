import * as THREE from "three";
import type { World } from "../sim/world.js";

const MAX_TRAIL = 600;

export class Trails {
  readonly group = new THREE.Group();
  private readonly lines: THREE.Line[] = [];
  private readonly buffers: Float32Array[] = [];
  private readonly counts: number[] = [];
  private readonly heads: number[] = [];
  private frame = 0;
  private readonly stride = 2;

  constructor(scene: THREE.Scene, world: World) {
    for (let i = 1; i < world.coreCount; i++) {
      const b = world.core[i];
      const buf = new Float32Array(MAX_TRAIL * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(buf, 3));
      geo.setDrawRange(0, 0);
      const mat = new THREE.LineBasicMaterial({
        color: b.color,
        transparent: true,
        opacity: 0.55,
      });
      const line = new THREE.Line(geo, mat);
      line.frustumCulled = false;
      this.lines.push(line);
      this.buffers.push(buf);
      this.counts.push(0);
      this.heads.push(0);
      this.group.add(line);
    }
    scene.add(this.group);
  }

  setVisible(v: boolean): void {
    this.group.visible = v;
  }

  clear(): void {
    for (let i = 0; i < this.lines.length; i++) {
      this.counts[i] = 0;
      this.heads[i] = 0;
      this.lines[i].geometry.setDrawRange(0, 0);
    }
  }

  update(world: World): void {
    if (!this.group.visible) return;
    if (this.frame++ % this.stride !== 0) return;
    for (let li = 0; li < this.lines.length; li++) {
      const b = world.core[li + 1];
      const buf = this.buffers[li];
      const head = this.heads[li];
      buf[head * 3] = b.pos.x;
      buf[head * 3 + 1] = b.pos.y;
      buf[head * 3 + 2] = b.pos.z;
      this.heads[li] = (head + 1) % MAX_TRAIL;
      if (this.counts[li] < MAX_TRAIL) this.counts[li]++;

      const geo = this.lines[li].geometry as THREE.BufferGeometry;
      geo.setDrawRange(0, this.counts[li]);
      geo.attributes.position.needsUpdate = true;
    }
  }
}
