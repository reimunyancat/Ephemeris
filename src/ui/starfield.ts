import * as THREE from "three";
import { mulberry32 } from "../data/asteroidBelt";

export function createStarfield(count = 4000, radius = 1500): THREE.Points {
  const rand = mulberry32(98765);
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = rand() * 2 - 1;
    const phi = rand() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = radius * (0.7 + rand() * 0.3);
    positions[i * 3] = r * s * Math.cos(phi);
    positions[i * 3 + 1] = r * s * Math.sin(phi);
    positions[i * 3 + 2] = r * u;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.2,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.8,
  });
  return new THREE.Points(geo, mat);
}
