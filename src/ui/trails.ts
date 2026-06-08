import * as THREE from "three";
import { Body } from "../core/body";

export interface Trails {
  update: () => void;
}

export function createTrails(
  scene: THREE.Scene,
  bodies: Body[],
  maxPoints = 600,
): Trails {
  const trails = new Map<
    Body,
    { line: THREE.Line; positions: Float32Array; count: number }
  >();

  for (const b of bodies) {
    if (b.name === "태양") continue;

    const positions = new Float32Array(maxPoints * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setDrawRange(0, 0);

    const material = new THREE.LineBasicMaterial({
      color: 0x66aaff,
      transparent: true,
      opacity: 0.7,
    });
    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;
    scene.add(line);

    trails.set(b, { line, positions, count: 0 });
  }

  function update() {
    for (const [body, t] of trails) {
      const { positions } = t;

      if (t.count < maxPoints) {
        const i = t.count * 3;
        positions[i] = body.pos.x;
        positions[i + 1] = body.pos.y;
        positions[i + 2] = body.pos.z;
        t.count++;
      } else {
        positions.copyWithin(0, 3);
        const i = (maxPoints - 1) * 3;
        positions[i] = body.pos.x;
        positions[i + 1] = body.pos.y;
        positions[i + 2] = body.pos.z;
      }

      t.line.geometry.setDrawRange(0, t.count);
      t.line.geometry.attributes.position.needsUpdate = true;
    }
  }

  return { update };
}
