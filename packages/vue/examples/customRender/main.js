import { createRender } from "../../lib/ass-vue.esm.js";
import { App } from "./App.js";
console.log(PIXI);

const game = new PIXI.Application({
  width: 500,
  height: 500,
});

document.body.appendChild(game.view);

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

renderer.createApp(App).mount(game.stage);
