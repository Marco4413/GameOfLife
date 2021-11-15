import { wCanvas, UMath, Color } from "./wCanvas/wcanvas.js";

/**
 * All Possible Cell Types
 */
export const CELL_TYPES = {
    "DEAD_CELL": 0,
    "LIVE_CELL": 1
};

/**
 * The style used to draw a GameOfLife instance with
 * @typedef {Object} GOLStyle
 * @property {Object} cellColors
 * @property {Color} gridColor
 * @property {Boolean} showGrid
 */

export class GameOfLife {
    /**
     * @param {Number} width The width of the Game's Grid
     * @param {Number} height The height of the Game's Grid
     * @param {Boolean} wrapGrid Whether or not to wrap the grid's coordinates
     */
    constructor(width, height, wrapGrid) {
        this._size = new UMath.Vec2(width, height);
        this.wrapGrid = wrapGrid;

        /** @type {Number[]} */
        this._grid = [ ];
        this.ClearGrid();
    }

    /**
     * Clears the Game's Grid
     */
    ClearGrid() {
        this._grid = [ ];
        const gridLength = this._size.x * this._size.y;
        for (let i = 0; i < gridLength; i++)
            this._grid.push(CELL_TYPES.DEAD_CELL);
    }

    /**
     * Returns a copy of the Game's Grid
     * @returns {UMath.Vec2} The Size of the Game's Grid
     */
    GetGridSize() {
        return this._size.copy();
    }
    
    /**
     * @param {Number} x
     * @param {Number} y
     * @returns {Number}
     */
    _GetCellIndex(x, y) {
        if (this.wrapGrid) {
            const wrappedX = x % this._size.x;
            const wrappedY = y % this._size.y;
            return (wrappedX >= 0 ? wrappedX : ( this._size.x + wrappedX )) + (wrappedY >= 0 ? wrappedY : ( this._size.y + wrappedY )) * this._size.x;
        } else {
            if (x < 0 || x >= this._size.x || y < 0 || y >= this._size.y)
                return -1;
            return x + y * this._size.x;
        }
    }
    
    /**
     * Returns the Game's Cell at pos x, y in the Game's Grid
     * @param {Number} x The x of the cell
     * @param {Number} y The y of the cell
     * @returns {Number|undefined} The value of the cell or undefined if not present
     */
    GetCell(x, y) {
        const index = this._GetCellIndex(x, y);
        if (index < 0)
            return undefined;
        return this._grid[index];
    }
    
    /**
     * Sets the Game's Cell at pos x, y in the Game's Grid to the value specified
     * @param {Number} x The x of the cell to set
     * @param {Number} y The y of the cell to set
     * @param {Number} cellValue The new value of the specified cell
     * @returns {Boolean} Whether or not a cell was affected
     */
    SetCell(x, y, cellValue) {
        const index = this._GetCellIndex(x, y);
        if (index < 0)
            return false;
        this._grid[index] = cellValue;
        return true;
    }
    
    /**
     * Returns the Cells Surrounding the one specified
     * @param {Number} x The x pos of the cell to get the surrounding ones from
     * @param {Number} y The y pos of the cell to get the surrounding ones from
     * @returns {Number[]} The values of the surrounding cells
     */
    GetSurroundingCells(x, y) {
        const cells = [ ];
        for (let relY = -1; relY <= 1; relY++) {
            for (let relX = -1; relX <= 1; relX++) {
                if (relX === 0 && relY === 0) continue;
                const cell = this.GetCell(x + relX, y + relY);
                if (cell !== undefined)
                    cells.push(cell);
            }
        }
        return cells;
    }
    
    /**
     * Ticks the Game's Grid Once
     */
    Tick() {
        let newGrid = this._grid.slice();
        for (let y = 0; y < this._size.y; y++) {
            for (let x = 0; x < this._size.x; x++) {
                let cellIndex = this._GetCellIndex(x, y);
                if (cellIndex < 0) continue;
                const cell = this.GetCell(x, y);
    
                const surroundingCells = this.GetSurroundingCells(x, y);
                let liveCells = 0;
                for (let i = 0; i < surroundingCells.length; i++) {
                    if (surroundingCells[i] === CELL_TYPES.LIVE_CELL)
                        liveCells++;
                }
    
                if (cell === CELL_TYPES.DEAD_CELL) {
                    if (liveCells === 3)
                        newGrid[cellIndex] = CELL_TYPES.LIVE_CELL;
                } else if (cell === CELL_TYPES.LIVE_CELL) {
                    if (liveCells < 2 || liveCells > 3)
                        newGrid[cellIndex] = CELL_TYPES.DEAD_CELL;
                    else newGrid[cellIndex] = CELL_TYPES.LIVE_CELL;
                }
            }
        }
        this._grid = newGrid;
    }
    
    /**
     * @param {wCanvas} canvas
     * @param {Number} deltaTime
     * @param {UMath.Vec2} origin
     * @param {Number} cellSize
     * @param {GOLStyle} style
     */
    _DrawGrid(canvas, deltaTime, origin, cellSize, style) {
        canvas.stroke(style.gridColor);
        for (let y = 1; y < this._size.y; y++) {
            const cY = origin.y + y * cellSize;
            canvas.line(
                origin.x, cY,
                origin.x + this._size.x * cellSize, cY
            );
        }
    
        for (let x = 1; x < this._size.x; x++) {
            const cX = origin.x + x * cellSize;
            canvas.line(
                cX, origin.y,
                cX, origin.y + this._size.y * cellSize
            );
        }
    }
    
    /**
     * @param {wCanvas} canvas
     * @param {Number} deltaTime
     * @param {UMath.Vec2} origin
     * @param {Number} cellSize
     * @param {GOLStyle} style
     */
    _DrawBorder(canvas, deltaTime, origin, cellSize, style) {
        canvas.stroke(style.gridColor);

        const gridWidth  = this._size.x * cellSize;
        const gridHeight = this._size.y * cellSize;

        canvas.line(
            origin.x, origin.y,
            origin.x + gridWidth, origin.y
        );

        canvas.line(
            origin.x + gridWidth, origin.y,
            origin.x + gridWidth, origin.y + gridHeight
        );

        canvas.line(
            origin.x + gridWidth, origin.y + gridHeight,
            origin.x, origin.y + gridHeight
        );

        canvas.line(
            origin.x, origin.y + gridHeight,
            origin.x, origin.y
        );
    }

    /**
     * Draws the Game to the Specified Canvas
     * @param {wCanvas} canvas The canvas to draw to
     * @param {Number} deltaTime
     * @param {UMath.Vec2} origin The origin at which to start Drawing the Game from
     * @param {Number} cellSize The size of the Game's Cells
     * @param {GOLStyle} style The style to use to Draw the Game
     */
    Draw(canvas, deltaTime, origin, cellSize, style) {
        for (let y = 0; y < this._size.y; y++) {
            for (let x = 0; x < this._size.x; x++) {
                const cellValue = this.GetCell(x, y);
                const cellColor = style.cellColors[cellValue];
                if (cellColor !== undefined && cellColor !== null) {
                    canvas.fill(cellColor);
                    canvas.rect(
                        origin.x + x * cellSize,
                        origin.y + y * cellSize,
                        cellSize, cellSize,
                        { "noFill": false, "noStroke": true }
                    );
                }
            }
        }

        if (style.showGrid)
            this._DrawGrid(canvas, deltaTime, origin, cellSize, style);
        this._DrawBorder(canvas, deltaTime, origin, cellSize, style);
    }
}
