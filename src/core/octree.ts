import type { Body } from "./body.js";

const MAX_DEPTH = 50;
const SAME_POINT_EPS2 = 1e-20;

export class OctNode {
  xMin = 0;
  yMin = 0;
  zMin = 0;
  xMax = 0;
  yMax = 0;
  zMax = 0;
  depth = 0;

  comX = 0;
  comY = 0;
  comZ = 0;
  mass = 0;

  body: Body | null = null;
  children: (OctNode | null)[] = [
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ];
  count = 0;

  init(
    xMin: number,
    yMin: number,
    zMin: number,
    xMax: number,
    yMax: number,
    zMax: number,
    depth: number,
  ): OctNode {
    this.xMin = xMin;
    this.yMin = yMin;
    this.zMin = zMin;
    this.xMax = xMax;
    this.yMax = yMax;
    this.zMax = zMax;
    this.depth = depth;
    this.comX = 0;
    this.comY = 0;
    this.comZ = 0;
    this.mass = 0;
    this.body = null;
    this.count = 0;
    for (let i = 0; i < 8; i++) this.children[i] = null;
    return this;
  }

  get size(): number {
    return Math.max(
      this.xMax - this.xMin,
      this.yMax - this.yMin,
      this.zMax - this.zMin,
    );
  }

  isLeaf(): boolean {
    for (let i = 0; i < 8; i++) if (this.children[i] !== null) return false;
    return true;
  }

  octantOf(
    x: number,
    y: number,
    z: number,
    mx: number,
    my: number,
    mz: number,
  ): number {
    return (x >= mx ? 1 : 0) | (y >= my ? 2 : 0) | (z >= mz ? 4 : 0);
  }
}

export class OctreePool {
  private pool: OctNode[] = [];
  private idx = 0;

  acquire(
    xMin: number,
    yMin: number,
    zMin: number,
    xMax: number,
    yMax: number,
    zMax: number,
    depth: number,
  ): OctNode {
    let node = this.pool[this.idx];
    if (node === undefined) {
      node = new OctNode();
      this.pool[this.idx] = node;
    }
    this.idx++;
    return node.init(xMin, yMin, zMin, xMax, yMax, zMax, depth);
  }

  reset(): void {
    this.idx = 0;
  }
}

export function computeBounds(bodies: Body[]): {
  cx: number;
  cy: number;
  cz: number;
  half: number;
} {
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;
  for (const b of bodies) {
    if (b.pos.x < minX) minX = b.pos.x;
    if (b.pos.y < minY) minY = b.pos.y;
    if (b.pos.z < minZ) minZ = b.pos.z;
    if (b.pos.x > maxX) maxX = b.pos.x;
    if (b.pos.y > maxY) maxY = b.pos.y;
    if (b.pos.z > maxZ) maxZ = b.pos.z;
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;
  const half =
    Math.max(maxX - minX, maxY - minY, maxZ - minZ, 1e-6) * 0.5 * 1.0001 + 1e-9;
  return { cx, cy, cz, half };
}

export function buildOctree(bodies: Body[], pool: OctreePool): OctNode {
  pool.reset();
  const { cx, cy, cz, half } = computeBounds(bodies);
  const root = pool.acquire(
    cx - half,
    cy - half,
    cz - half,
    cx + half,
    cy + half,
    cz + half,
    0,
  );
  for (const b of bodies) insert(root, b, pool);
  return root;
}

function accumulate(node: OctNode, b: Body): void {
  const m = node.mass + b.mass;
  if (m > 0) {
    node.comX = (node.comX * node.mass + b.pos.x * b.mass) / m;
    node.comY = (node.comY * node.mass + b.pos.y * b.mass) / m;
    node.comZ = (node.comZ * node.mass + b.pos.z * b.mass) / m;
  }
  node.mass = m;
  node.count++;
}

function insert(node: OctNode, b: Body, pool: OctreePool): void {
  // 빈 리프
  if (node.body === null && node.isLeaf()) {
    node.body = b;
    accumulate(node, b);
    return;
  }

  if (node.isLeaf()) {
    const existing = node.body!;
    const dx = existing.pos.x - b.pos.x;
    const dy = existing.pos.y - b.pos.y;
    const dz = existing.pos.z - b.pos.z;
    if (
      node.depth >= MAX_DEPTH ||
      dx * dx + dy * dy + dz * dz < SAME_POINT_EPS2
    ) {
      accumulate(node, b);
      return;
    }
    node.body = null;
    placeInChild(node, existing, pool);
    placeInChild(node, b, pool);
    accumulate(node, b);
    return;
  }

  placeInChild(node, b, pool);
  accumulate(node, b);
}

function placeInChild(node: OctNode, b: Body, pool: OctreePool): void {
  const mx = (node.xMin + node.xMax) / 2;
  const my = (node.yMin + node.yMax) / 2;
  const mz = (node.zMin + node.zMax) / 2;
  const oct = node.octantOf(b.pos.x, b.pos.y, b.pos.z, mx, my, mz);
  let child = node.children[oct];
  if (child === null) {
    const xLo = oct & 1 ? mx : node.xMin;
    const xHi = oct & 1 ? node.xMax : mx;
    const yLo = oct & 2 ? my : node.yMin;
    const yHi = oct & 2 ? node.yMax : my;
    const zLo = oct & 4 ? mz : node.zMin;
    const zHi = oct & 4 ? node.zMax : mz;
    child = pool.acquire(xLo, yLo, zLo, xHi, yHi, zHi, node.depth + 1);
    node.children[oct] = child;
  }
  insert(child, b, pool);
}
