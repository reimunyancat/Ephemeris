import { makeSolarSystem } from "./data/planets";
import { computeAccelerations } from "./core/gravity";
import { velocityVerletStep } from "./core/integrator";
import { createScene } from "./ui/scene";
import { createTrails } from "./ui/trails";

const bodies = makeSolarSystem();
computeAccelerations(bodies);

const view = createScene(bodies);
const trails = createTrails(view.scene, bodies);

const dt = 1;
const stepsPerFrame = 2;

function animate() {
  for (let i = 0; i < stepsPerFrame; i++) {
    velocityVerletStep(bodies, dt);
  }
  trails.update();
  view.render();
  requestAnimationFrame(animate);
}

animate();
