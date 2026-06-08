import * as THREE from "three";
import { OctNode, OctreePool, buildOctree } from "../core/octree.js";
import type { World } from "../sim/world.js";

const MAX_EDGES = 200000;
const CUBE_EDGES: [number, number][] = [
  [0, 1],
  [1, 3],
  [3, 2],
  [2, 0],
  [4, 5],
  [5, 7],
  [7, 6],
  [6, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

export class OctreeViz {
  readonly segments: THREE.LineSegments;
  private readonly positions: Float32Array;
  private readonly geo = new THREE.BufferGeometry();
  private readonly vizPool = new OctreePool();
  private enabled = false;

  constructor(scene: THREE.Scene) {
    this.positions = new Float32Array(MAX_EDGES * 2 * 3);
    this.geo.setAttribute(
      "position",
      new THREE.BufferAttribute(this.positions, 3),
    );
    this.geo.setDrawRange(0, 0);
    const mat = new THREE.LineBasicMaterial({
      color: 0x39d0a0,
      transparent: true,
      opacity: 0.25,
    });
    this.segments = new THREE.LineSegments(this.geo, mat);
    this.segments.frustumCulled = false;
    this.segments.visible = false;
    scene.add(this.segments);
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
    this.segments.visible = v;
  }

  toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  update(world: World): void {
    if (!this.enabled) return;
    const root = buildOctree(world.bodies, this.vizPool);
    let vi = 0;
    const pos = this.positions;
    const stack: OctNode[] = [root];
    while (stack.length > 0) {
      const node = stack.pop()!;
      if (node.count === 0) continue;
      const c = [
        [node.xMin, node.yMin, node.zMin],
        [node.xMax, node.yMin, node.zMin],
        [node.xMin, node.yMax, node.zMin],
        [node.xMax, node.yMax, node.zMin],
        [node.xMin, node.yMin, node.zMax],
        [node.xMax, node.yMin, node.zMax],
        [node.xMin, node.yMax, node.zMax],
        [node.xMax, node.yMax, node.zMax],
      ];
      for (const [a, b] of CUBE_EDGES) {
        if (vi + 6 > pos.length) break;
        pos[vi++] = c[a][0];
        pos[vi++] = c[a][1];
        pos[vi++] = c[a][2];
        pos[vi++] = c[b][0];
        pos[vi++] = c[b][1];
        pos[vi++] = c[b][2];
      }
      for (let k = 0; k < 8; k++) {
        const child = node.children[k];
        if (child !== null) stack.push(child);
      }
    }
    this.geo.setDrawRange(0, vi / 3);
    this.geo.attributes.position.needsUpdate = true;
  }
}
