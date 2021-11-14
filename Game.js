import { wCanvas, UMath, Color } from "./wCanvas/wcanvas.js";

export const CELL_TYPES = {
    "DEAD_CELL": 0,
    "LIVE_CELL": 1
};

/**
 * @typedef {Object} GOLStyle
 * @property {Object} cellColors
 * @property {Color} gridColor
 * @property {Boolean} showGrid
 */

export class GameOfLife {
    /**
     * @param {Number} width
     * @param {Number} height
     * @param {Boolean} wrapGrid
     */
    constructor(width, height, wrapGrid) {
        this._size = new UMath.Vec2(width, height);
        this.wrapGrid = wrapGrid;

        /** @type {Number[]} */
        this._grid = [ ];
        this.ClearGrid();
    }

    /**
     * @param {Number} size
     */
    ClearGrid() {
        this._grid = [ ];
        const gridLength = this._size.x * this._size.y;
        for (let i = 0; i < gridLength; i++)
            this._grid.push(CELL_TYPES.DEAD_CELL);
    }

    GetGridSize() {
        return this._size.copy();
    }
    
    /**
     * @param {Number} x
     * @param {Number} y
     * @returns {Number}
     */
    GetCellIndex(x, y) {
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
     * @param {Number} x
     * @param {Number} y
     * @returns {Number|undefined}
     */
    GetCell(x, y) {
        const index = this.GetCellIndex(x, y);
        if (index < 0)
            return undefined;
        return this._grid[index];
    }
    
    /**
     * @param {Number} x
     * @param {Number} y
     * @param {Number} cellValue
     * @returns {Boolean}
     */
    SetCell(x, y, cellValue) {
        const index = this.GetCellIndex(x, y);
        if (index < 0)
            return false;
        this._grid[index] = cellValue;
        return true;
    }
    
    /**
     * @param {Number} x
     * @param {Number} y
     * @returns {Number[]}
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
    
    Tick() {
        let newGrid = this._grid.slice();
        for (let y = 0; y < this._size.y; y++) {
            for (let x = 0; x < this._size.x; x++) {
                let cellIndex = this.GetCellIndex(x, y);
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
    DrawGrid(canvas, deltaTime, origin, cellSize, style) {
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
    DrawBorder(canvas, deltaTime, origin, cellSize, style) {
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
     * @param {wCanvas} canvas
     * @param {Number} deltaTime
     * @param {UMath.Vec2} origin
     * @param {Number} cellSize
     * @param {GOLStyle} style
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
            this.DrawGrid(canvas, deltaTime, origin, cellSize, style);
        this.DrawBorder(canvas, deltaTime, origin, cellSize, style);
    }
}
