import { createScene } from "./ui/scene.js";
import { createStarfield } from "./ui/starfield.js";
import { BodyView } from "./ui/bodies.js";
import { Trails } from "./ui/trails.js";
import { OctreeViz } from "./ui/octreeViz.js";
import { Panel } from "./ui/panel.js";
import { installControls } from "./ui/controls.js";
import { World } from "./sim/world.js";

function main(): void {
  const canvas = document.getElementById("app") as HTMLCanvasElement;
  const hud = document.getElementById("hud") as HTMLElement;

  const ctx = createScene(canvas);
  const world = new World({ belt: false });

  ctx.scene.add(createStarfield());
  const bodyView = new BodyView(ctx.scene, world);
  const trails = new Trails(ctx.scene, world);
  trails.setVisible(true);
  const octree = new OctreeViz(ctx.scene);
  const panel = new Panel(hud);
  const input = installControls(
    ctx.renderer,
    ctx.camera,
    ctx.controls,
    world,
    bodyView,
    trails,
    octree,
    panel,
  );

  let fps = 60;
  let last = performance.now();

  function frame(now: number): void {
    const dtMs = now - last;
    last = now;
    if (dtMs > 0) fps += (1000 / dtMs - fps) * 0.1;

    world.step();
    bodyView.update();
    trails.update(world);
    octree.update(world);
    input.updateTracking();
    panel.update(world, fps, world.bodies.length);
    ctx.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

main();
