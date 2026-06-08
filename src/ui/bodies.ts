import * as THREE from "three";
import type { World } from "../sim/world.js";

export class BodyView {
  readonly group = new THREE.Group();
  readonly planetMeshes: THREE.Mesh[] = [];
  private readonly asteroidGeo = new THREE.BufferGeometry();
  private readonly asteroidPositions: Float32Array;
  private readonly asteroidPoints: THREE.Points;
  private readonly world: World;

  constructor(scene: THREE.Scene, world: World) {
    this.world = world;

    for (let i = 0; i < world.coreCount; i++) {
      const b = world.core[i];
      const geo = new THREE.SphereGeometry(b.radius, 32, 16);
      const isSun = i === 0;
      const mat = isSun
        ? new THREE.MeshBasicMaterial({ color: b.color })
        : new THREE.MeshStandardMaterial({
            color: b.color,
            roughness: 0.85,
            metalness: 0.0,
          });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = b.name;
      mesh.userData.bodyIndex = i;
      this.planetMeshes.push(mesh);
      this.group.add(mesh);
    }

    const n = world.belt.length;
    this.asteroidPositions = new Float32Array(n * 3);
    this.asteroidGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(this.asteroidPositions, 3),
    );
    const astMat = new THREE.PointsMaterial({
      color: 0xa9a9a9,
      size: 2.0,
      sizeAttenuation: false,
    });
    this.asteroidPoints = new THREE.Points(this.asteroidGeo, astMat);
    this.asteroidPoints.frustumCulled = false;
    this.group.add(this.asteroidPoints);

    scene.add(this.group);
  }

  get pickables(): THREE.Object3D[] {
    return this.planetMeshes;
  }

  update(): void {
    const w = this.world;
    for (let i = 0; i < this.planetMeshes.length; i++) {
      const b = w.core[i];
      this.planetMeshes[i].position.set(b.pos.x, b.pos.y, b.pos.z);
    }

    if (w.beltEnabled) {
      this.asteroidPoints.visible = true;
      const pos = this.asteroidPositions;
      for (let k = 0; k < w.belt.length; k++) {
        const b = w.belt[k];
        pos[k * 3] = b.pos.x;
        pos[k * 3 + 1] = b.pos.y;
        pos[k * 3 + 2] = b.pos.z;
      }
      this.asteroidGeo.attributes.position.needsUpdate = true;
    } else {
      this.asteroidPoints.visible = false;
    }
  }
}
