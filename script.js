import { wCanvas, Color, UMath } from "./wCanvas/wcanvas.js";
import * as Game from "./Game.js";

const KEYS = {
    "TOGGLE_GRID": "g",
    "TOGGLE_MENU": "h",
    "TICK": " "
};

/** @type {Game.GOLStyle} */
const GOL_STYLE = {
    "cellColors": { },
    "gridColor": new Color("#555"),
    "showGrid": true
};

GOL_STYLE.cellColors[Game.CELL_TYPES.DEAD_CELL] = null;
GOL_STYLE.cellColors[Game.CELL_TYPES.LIVE_CELL] = new Color("#0f0");

const BACKGROUND_COLOR = new Color("#000");
let GAME_ORIGIN = new UMath.Vec2();
let CELL_SIZE = 0;

let GAME = new Game.GameOfLife(0, 0, false);

let timeSinceLastTick = 0;
let autoTickInterval = 0;
let autoTick = false;

/**
 * @param {wCanvas} canvas
 * @param {Number} deltaTime
 */
const draw = (canvas, deltaTime) => {
    canvas.background(BACKGROUND_COLOR);

    GAME.Draw(canvas, deltaTime, GAME_ORIGIN, CELL_SIZE, GOL_STYLE);

    if (autoTick) {
        timeSinceLastTick += deltaTime;
        if (timeSinceLastTick >= autoTickInterval) {
            GAME.Tick();
            timeSinceLastTick = 0;
        }
    }
}

/**
 * @param {String} elementID
 * @param {(el: HTMLElement) => void} callback
 * @returns {HTMLElement?}
 */
function wrapElementOnChange(elementID, callback) {
    /** @type {HTMLElement} */
    const element = document.getElementById(elementID);
    element.addEventListener("change", () => {
        callback(element);
    });
    callback(element);
    return element;
}

const setCanvasCell = (cX, cY, cellValue) => {
    if (GAME === undefined || GAME === null) {
        console.error(`setCanvasCell on ${GAME} Game.`);
        return false;
    }
    
    const cellX = Math.floor((cX - GAME_ORIGIN.x) / CELL_SIZE);
    const cellY = Math.floor((cY - GAME_ORIGIN.y) / CELL_SIZE);
    return GAME.SetCell(cellX, cellY, cellValue);
}

const recalcGameCoords = (canvas) => {
    if (GAME === undefined || GAME === null) {
        console.error(`recalcGameCoords on ${GAME} Game.`);
        return;
    }

    const gridSize = GAME.GetGridSize();
    
    const canvasW = canvas.element.width;
    const canvasH = canvas.element.height;
    CELL_SIZE = Math.min(canvasW / gridSize.x, canvasH / gridSize.y);
    GAME_ORIGIN = new UMath.Vec2(
        (canvasW - gridSize.x * CELL_SIZE) / 2,
        (canvasH - gridSize.y * CELL_SIZE) / 2
    );
}

const createGame = (w = undefined, h = undefined) => {
    if (GAME === undefined || GAME === null) {
        GAME = new Game.GameOfLife(0, 0, false);
        return;
    }

    const currentSize = GAME.GetGridSize();
    const isWrapping = GAME.wrapGrid;
    GAME = new Game.GameOfLife(
        w === undefined ? currentSize.x : w,
        h === undefined ? currentSize.y : h,
        isWrapping
    );
}

window.addEventListener("load", () => {
    const canvas = new wCanvas({
        "onDraw": draw,
        "onResize": (canvas, canvasW, canvasH) => {
            canvas.element.width  = canvasW;
            canvas.element.height = canvasH;
            recalcGameCoords(canvas);
        }
    });

    wrapElementOnChange("autoTick", (el) => {
        autoTick = el.checked;
    });

    wrapElementOnChange("autoTickInterval", (el) => {
        if (!Number.isNaN(el.valueAsNumber)) {
            autoTickInterval = el.valueAsNumber;
        }
    });

    wrapElementOnChange("gridWidth", (el) => {
        if (!Number.isNaN(el.valueAsNumber)) {
            const newWidth = Math.floor(el.valueAsNumber);
            createGame(newWidth, undefined);
            recalcGameCoords(canvas);
        }
    });

    wrapElementOnChange("gridHeight", (el) => {
        if (!Number.isNaN(el.valueAsNumber)) {
            const newHeight = Math.floor(el.valueAsNumber);
            createGame(undefined, newHeight);
            recalcGameCoords(canvas);
        }
    });

    document.getElementById("resetGrid").addEventListener("click", () => GAME.ClearGrid());

    wrapElementOnChange("wrapGrid", (el) => {
        GAME.wrapGrid = el.checked;
    });

    recalcGameCoords(canvas);

    canvas.element.addEventListener("mousedown", ev => {
        setCanvasCell(ev.x, ev.y, ev.ctrlKey ? Game.CELL_TYPES.DEAD_CELL : Game.CELL_TYPES.LIVE_CELL);
    });

    canvas.element.addEventListener("mousemove", ev => {
        if (ev.buttons === 1) {
            setCanvasCell(ev.x, ev.y, ev.ctrlKey ? Game.CELL_TYPES.DEAD_CELL : Game.CELL_TYPES.LIVE_CELL);
        }
    });

    const settingsMenu = document.getElementById("settings");
    document.addEventListener("keydown", (ev) => {
        switch (ev.key.toLowerCase()) {
            case KEYS.TOGGLE_MENU:
                settingsMenu.classList.toggle("hidden");
                break;
            case KEYS.TOGGLE_GRID:
                GOL_STYLE.showGrid = !GOL_STYLE.showGrid;
                break;
            case KEYS.TICK:
                GAME.Tick();
                break;
        }
    });
});
