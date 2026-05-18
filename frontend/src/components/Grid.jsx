import { useState, useEffect } from "react";

const GRID_SIZE = 21;

function Grid({ robotPosition, onCellClick, mapData }) {
  // mapData is now handled directly by props from App.jsx to coordinate obstacle walls

  if (!mapData) return <div className="grid-message">Loading arena map...</div>;

  const cells = [];

  // Loop through grid coordinates from top to bottom (Y descending: 20 down to 0)
  for (let y = GRID_SIZE - 1; y >= 0; y--) {
    // Loop through grid coordinates from left to right (X ascending: 0 up to 20)
    for (let x = 0; x < GRID_SIZE; x++) {
      let cellClass = "grid-cell";

      const isRobot = robotPosition.x === x && robotPosition.y === y;
      const isOrigin = x === 0 && y === 0;

      // CORRECT MATRIX INDEXING:
      // In Cartesian physics, Y goes up. In standard array matrices, row 0 is the top.
      // To flip it so Cartesian Y=20 is the top row, the matrix row index is (GRID_SIZE - 1 - y).
      const arrayRow = (GRID_SIZE - 1) - y;
      const arrayCol = x;
      
      // A value of 1 in the grid array means it is an obstacle
      const isObstacle = mapData?.grid?.[arrayRow]?.[arrayCol] === 1;

      if (isRobot) {
        cellClass += " robot-cell";
      } else if (isObstacle) {
        cellClass += " obstacle-cell";
      } else if (isOrigin) {
        cellClass += " origin-cell";
      }

      cells.push(
        <div 
          key={`${x}-${y}`} 
          className={cellClass}
          onClick={() => onCellClick(x, y)}
        >
          <span className="cell-coord">
            {x},{y}
          </span>
        </div>
      );
    }
  }

  return (
    <div className="grid-wrapper">
      <div className="grid-map">{cells}</div>
    </div>
  );
}

export default Grid;