import * as THREE from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { World } from "../sim/world.js";
import type { BodyView } from "./bodies.js";
import type { Trails } from "./trails.js";
import type { OctreeViz } from "./octreeViz.js";
import type { Panel } from "./panel.js";

export interface InputHandles {
  updateTracking(): void;
}

export function installControls(
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  orbit: OrbitControls,
  world: World,
  bodyView: BodyView,
  trails: Trails,
  octree: OctreeViz,
  panel: Panel,
): InputHandles {
  let trackIndex = -1;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const lastTracked = new THREE.Vector3();

  function setSpeed(scale: number): void {
    world.dtScale = Math.max(-64, Math.min(64, scale));
  }

  window.addEventListener("keydown", (e) => {
    switch (e.code) {
      case "Space":
        e.preventDefault();
        world.paused = !world.paused;
        break;
      case "ArrowRight":
        setSpeed(world.dtScale <= 0 ? 1 : world.dtScale * 2);
        break;
      case "ArrowLeft":
        setSpeed(world.dtScale >= 0 ? -1 : world.dtScale * 2);
        break;
      case "KeyB":
        world.setBelt(!world.beltEnabled);
        break;
      case "KeyO":
        octree.toggle();
        break;
      case "KeyT": {
        const v = !trails.group.visible;
        trails.setVisible(v);
        if (!v) trails.clear();
        break;
      }
      case "Digit1":
        world.setIntegrator("verlet");
        break;
      case "Digit2":
        world.setIntegrator("euler");
        break;
      case "Digit3":
        world.setIntegrator("rk4");
        break;
      case "KeyN":
        world.setMethod(world.method === "bh" ? "naive" : "bh");
        break;
      case "KeyM":
        world.setBeltMode(world.beltMode === "test" ? "nbody" : "test");
        break;
      case "BracketRight":
        world.jumpTime(365);
        trails.clear();
        break;
      case "BracketLeft":
        world.jumpTime(-365);
        trails.clear();
        break;
      case "Escape":
        trackIndex = -1;
        panel.selected = -1;
        break;
    }
  });

  renderer.domElement.addEventListener("dblclick", (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(bodyView.pickables, false);
    if (hits.length > 0) {
      const idx = hits[0].object.userData.bodyIndex as number;
      trackIndex = idx;
      panel.selected = idx;
      const b = world.core[idx];
      lastTracked.set(b.pos.x, b.pos.y, b.pos.z);
    }
  });

  return {
    updateTracking() {
      if (trackIndex < 0) return;
      const b = world.core[trackIndex];
      const cur = new THREE.Vector3(b.pos.x, b.pos.y, b.pos.z);
      // 행성이 이동한 만큼 카메라도 평행 이동 → 대상을 프레임 안에 고정
      const delta = cur.clone().sub(lastTracked);
      camera.position.add(delta);
      orbit.target.copy(cur);
      lastTracked.copy(cur);
    },
  };
}
