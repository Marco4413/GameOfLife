import { wCanvas } from "./wCanvas/wcanvas.js";

/**
 * @param {wCanvas} canvas
 * @param {Number} deltaTime
 */
const draw = (canvas, deltaTime) => {
    canvas.background(0);
}

window.addEventListener("load", () => {
    const canvas = new wCanvas({
        "onDraw": draw
    });
});
