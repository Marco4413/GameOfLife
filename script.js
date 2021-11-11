import { wCanvas, Color, UMath } from "./wCanvas/wcanvas.js";

const BACKGROUND_COLOR = new Color("#000");
const GRID_COLOR = new Color("#555");

const DEAD_CELL = 0;
const LIVE_CELL = 1;

const CELL_COLORS = { }
CELL_COLORS[DEAD_CELL] = null;
CELL_COLORS[LIVE_CELL] = new Color("#0f0");

let GRID_ORIGIN = new UMath.Vec2();
let CELL_SIZE = 0;

let wrapGrid = true;

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
    if (wrapGrid) {
        const wrappedX = x % gridWidth;
        const wrappedY = y % gridHeight;
        return (wrappedX >= 0 ? wrappedX : ( gridWidth + wrappedX )) + (wrappedY >= 0 ? wrappedY : ( gridHeight + wrappedY )) * gridWidth;
    } else {
        if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight)
            return -1;
        return x + y * gridWidth;
    }
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

let timeSinceLastStep = 0;
let autoStepInterval = 0;
let autoStep = false;

/**
 * @param {wCanvas} canvas
 * @param {Number} deltaTime
 */
const drawGrid = (canvas, deltaTime) => {
    canvas.stroke(GRID_COLOR);
    for (let y = 0; y < gridHeight + 1; y++) {
        const cY = GRID_ORIGIN.y + y * CELL_SIZE;
        canvas.line(
            GRID_ORIGIN.x, cY,
            GRID_ORIGIN.x + gridWidth * CELL_SIZE, cY
        );
    }

    for (let x = 0; x < gridWidth + 1; x++) {
        const cX = GRID_ORIGIN.x + x * CELL_SIZE;
        canvas.line(
            cX, GRID_ORIGIN.y,
            cX, GRID_ORIGIN.y + gridHeight * CELL_SIZE
        );
    }
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

    drawGrid(canvas, deltaTime);

    if (autoStep) {
        timeSinceLastStep += deltaTime;
        if (timeSinceLastStep >= autoStepInterval) {
            stepSimulation();
            timeSinceLastStep = 0;
        }
    }
}

window.addEventListener("load", () => {
    const recalcGridSize = (canvas) => {
        const canvasW = canvas.element.width;
        const canvasH = canvas.element.height;
        CELL_SIZE = Math.min(canvasW / gridWidth, canvasH / gridHeight);

        GRID_ORIGIN = new UMath.Vec2(
            (canvasW - gridWidth  * CELL_SIZE) / 2,
            (canvasH - gridHeight * CELL_SIZE) / 2
        );
    }


    resetGrid();
    const canvas = new wCanvas({
        "onDraw": draw,
        "onResize": (canvas, canvasW, canvasH) => {
            canvas.element.width  = canvasW;
            canvas.element.height = canvasH;
            recalcGridSize(canvas);
        }
    });

    /** @type {HTMLInputElement} */
    const elAutoStep = document.getElementById("autoStep");
    autoStep = elAutoStep.checked;
    elAutoStep.addEventListener("change", () => {
        autoStep = elAutoStep.checked;
    });

    /** @type {HTMLInputElement} */
    const elAutoStepInterval = document.getElementById("autoStepInterval");
    autoStepInterval = elAutoStepInterval.valueAsNumber;
    elAutoStepInterval.addEventListener("change", () => {
        if (!Number.isNaN(elAutoStepInterval.valueAsNumber)) {
            autoStepInterval = elAutoStepInterval.valueAsNumber;
        }
    });

    /** @type {HTMLInputElement} */
    const elGridWidth = document.getElementById("gridWidth");
    gridWidth = elGridWidth.valueAsNumber;
    elGridWidth.addEventListener("change", () => {
        if (!Number.isNaN(elGridWidth.valueAsNumber)) {
            gridWidth = Math.floor(elGridWidth.valueAsNumber);
            resetGrid();
            recalcGridSize(canvas);
        }
    });

    /** @type {HTMLInputElement} */
    const elGridHeight = document.getElementById("gridHeight");
    gridHeight = elGridHeight.valueAsNumber;
    elGridHeight.addEventListener("change", () => {
        if (!Number.isNaN(elGridHeight.valueAsNumber)) {
            gridHeight = Math.floor(elGridHeight.valueAsNumber);
            resetGrid();
            recalcGridSize(canvas);
        }
    });

    document.getElementById("resetGrid").addEventListener("click", resetGrid);

    /** @type {HTMLInputElement} */
    const elWrapGrid = document.getElementById("wrapGrid");
    wrapGrid = elWrapGrid.checked;
    elWrapGrid.addEventListener("change", () => {
        wrapGrid = elWrapGrid.checked;
    });

    resetGrid();
    recalcGridSize(canvas);

    const setCanvasCell = (cX, cY, cell) => {
        const cellX = Math.floor((cX - GRID_ORIGIN.x) / CELL_SIZE);
        const cellY = Math.floor((cY - GRID_ORIGIN.y) / CELL_SIZE);
        setCell(cellX, cellY, cell);
    }

    canvas.element.addEventListener("mousedown", ev => {
        setCanvasCell(ev.x, ev.y, ev.ctrlKey ? DEAD_CELL : LIVE_CELL);
    });

    canvas.element.addEventListener("mousemove", ev => {
        if (ev.buttons === 1) {
            setCanvasCell(ev.x, ev.y, ev.ctrlKey ? DEAD_CELL : LIVE_CELL);
        }
    });
});
