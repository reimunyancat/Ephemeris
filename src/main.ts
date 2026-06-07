import { makeSolarSystem } from "./data/planets";
import { computeAccelerations } from "./core/gravity";
import { velocityVerletStep } from "./core/integrator";
import { createScene } from "./ui/scene";

const bodies = makeSolarSystem();
computeAccelerations(bodies);

const scene = createScene(bodies);

const dt = 1;
const stepsPerFrame = 2;

function animate() {
  for (let i = 0; i < stepsPerFrame; i++) {
    velocityVerletStep(bodies, dt);
  }
  scene.render();
  requestAnimationFrame(animate);
}

animate();
