import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Body } from "../core/body";
import { ThreeMFLoader } from "three/examples/jsm/Addons.js";

export interface Scene3D {
  render: () => void;
  meshes: Map<Body, THREE.Mesh>;
  scene: THREE.Scene;
}

export function createScene(bodies: Body[]): Scene3D {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000008);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.01,
    5000,
  );
  camera.up.set(0, 0, 1);
  camera.position.set(0, -8, 5);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const meshes = new Map<Body, THREE.Mesh>();
  for (const b of bodies) {
    const isSun = b.name === "태양";
    const geometry = new THREE.SphereGeometry(isSun ? 0.3 : 0.08, 24, 24);
    const material = new THREE.MeshBasicMaterial({
      color: isSun ? 0xffcc33 : 0x66ccff,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    meshes.set(b, mesh);
  }

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function render() {
    for (const [body, mesh] of meshes) {
      mesh.position.set(body.pos.x, body.pos.y, body.pos.z);
    }
    controls.update();
    renderer.render(scene, camera);
  }
  return { render, meshes, scene };
}
