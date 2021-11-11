import { wCanvas, Color, UMath } from "./wCanvas/wcanvas.js";

const BACKGROUND_COLOR = new Color("#000");

const DEAD_CELL = 0;
const LIVE_CELL = 1;

const CELL_COLORS = { }
CELL_COLORS[DEAD_CELL] = null;
CELL_COLORS[LIVE_CELL] = new Color("#0f0");

let GRID_ORIGIN = new UMath.Vec2();
let CELL_SIZE = 0;

/** @type {Number} */
let gridWidth = 5;
/** @type {Number} */
let gridHeight = 5;
/** @type {Number[]} */
let grid;

/**
 * @param {Number} size
 */
const resetGrid = () => {
    grid = [ ];
    for (let i = 0; i < gridWidth * gridHeight; i++)
        grid.push(DEAD_CELL);
}

/**
 * @param {Number} x
 * @param {Number} y
 * @returns {Number}
 */
const getCellIndex = (x, y) => {
    if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight)
        return -1;
    return x + y * gridWidth;
}

/**
 * @param {Number} x
 * @param {Number} y
 * @returns {Number|undefined}
 */
const getCell = (x, y) => {
    const index = getCellIndex(x, y);
    if (index < 0)
        return undefined;
    return grid[index];
}

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} cellValue
 * @returns {Boolean}
 */
const setCell = (x, y, cellValue) => {
    const index = getCellIndex(x, y);
    if (index < 0)
        return false;
    grid[getCellIndex(x, y)] = cellValue;
    return true;
}

/**
 * @param {Number} x
 * @param {Number} y
 * @returns {Number[]}
 */
const getSurroundingCells = (x, y) => {
    const cells = [ ];
    for (let relY = -1; relY <= 1; relY++) {
        for (let relX = -1; relX <= 1; relX++) {
            if (relX === 0 && relY === 0) continue;
            const cell = getCell(x + relX, y + relY);
            if (cell !== undefined)
                cells.push(cell);
        }
    }
    return cells;
}

const stepSimulation = () => {
    let newGrid = grid.slice();
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            let cellIndex = getCellIndex(x, y);
            if (cellIndex < 0) continue;
            const cell = getCell(x, y);

            const surroundingCells = getSurroundingCells(x, y);
            let liveCells = 0;
            for (let i = 0; i < surroundingCells.length; i++) {
                if (surroundingCells[i] === LIVE_CELL)
                    liveCells++;
            }

            if (cell === DEAD_CELL) {
                if (liveCells === 3)
                    newGrid[cellIndex] = LIVE_CELL;
            } else if (cell === LIVE_CELL) {
                if (liveCells < 2 || liveCells > 3)
                    newGrid[cellIndex] = DEAD_CELL;
                else newGrid[cellIndex] = LIVE_CELL;
            }
        }
    }
    grid = newGrid;
}

/**
 * @param {wCanvas} canvas
 * @param {Number} deltaTime
 */
const draw = (canvas, deltaTime) => {
    canvas.background(BACKGROUND_COLOR);

    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            const cellValue = getCell(x, y);
            const cellColor = CELL_COLORS[cellValue];
            if (cellColor !== undefined && cellColor !== null) {
                canvas.fill(cellColor);
                canvas.rect(
                    GRID_ORIGIN.x + x * CELL_SIZE,
                    GRID_ORIGIN.y + y * CELL_SIZE,
                    CELL_SIZE, CELL_SIZE,
                    { "noFill": false, "noStroke": true }
                );
            }
        }
    }
}

window.addEventListener("load", () => {
    const canvas = new wCanvas({
        "onDraw": draw,
        "onSetup": (canvas) => {
            resetGrid();
            setCell(2, 1, LIVE_CELL);
            setCell(2, 2, LIVE_CELL);
            setCell(2, 3, LIVE_CELL);
            canvas.startLoop();
        },
        "onResize": (canvas, canvasW, canvasH) => {
            canvas.element.width  = canvasW;
            canvas.element.height = canvasH;
            CELL_SIZE = Math.min(canvasW / gridWidth, canvasH / gridHeight);

            GRID_ORIGIN = new UMath.Vec2(
                (canvasW - gridWidth  * CELL_SIZE) / 2,
                (canvasH - gridHeight * CELL_SIZE) / 2
            );
        }
    });

    canvas.element.addEventListener("click", () => {
        stepSimulation();
    });
});
