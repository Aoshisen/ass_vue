import { createRender } from "../../dist/ass-vue.esm.js";
import { App } from "./App.js";

(async () => {
  const app = new PIXI.Application();
  await app.init({ background: "#1099bb", width: 700, height: 700 })

  document.body.appendChild(app.canvas);


  const createElement = (type) => {
    if (type === "rect") {
      const rect = new PIXI.Graphics();
      rect.beginFill(0xff0000);
      rect.drawRect(0, 0, 100, 100);
      rect.endFill();
      return rect;
    }
  };

  const patchProp = (el, key, val) => {
    el[key] = val;
  };

  const insert = (el, parent) => {
    parent.addChild(el);
  };

  const renderer = createRender({
    createElement,
    patchProp,
    insert,
  });

  renderer.createApp(App).mount(app.stage);
})()
