const GRID_SIZE = 21

function Grid() {

  const robotPosition = {
    x: 5,
    y: 8
  }

  const obstacles = [
    { x: 3, y: 4 },
    { x: 10, y: 15 },
    { x: 7, y: 2 }
  ]

  const cells = []

  for (let y = GRID_SIZE - 1; y >= 0; y--) {

    for (let x = 0; x < GRID_SIZE; x++) {

      let cellClass = "grid-cell"

      const isRobot =
        robotPosition.x === x &&
        robotPosition.y === y

      const isObstacle =
        obstacles.some(
          obstacle =>
            obstacle.x === x &&
            obstacle.y === y
        )

     const isOrigin =
        x === 0 &&
        y === 0

      if (isRobot) {
        cellClass += " robot-cell"
      }
      else if (isObstacle) {
        cellClass += " obstacle-cell"
      }
      else if (isOrigin) {
        cellClass += " origin-cell"
      }

      cells.push(
        <div
          key={`${x}-${y}`}
          className={cellClass}
        >
          <span className="cell-coord">
            {x},{y}
          </span>
        </div>
      )
    }
  }

  return (
    <div className="grid-wrapper">

      <div className="grid-map">
        {cells}
      </div>

    </div>
  )
}

export default Grid