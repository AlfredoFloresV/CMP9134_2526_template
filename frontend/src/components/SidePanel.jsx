function SidePanel({ telemetry, onDirectionMove }) {
  const { id, battery, status, position } = telemetry;

  const handleArrowPress = (direction) => {
    let targetX = position.x;
    let targetY = position.y;

    if (direction === "up") targetY += 1;
    if (direction === "down") targetY -= 1;
    if (direction === "left") targetX -= 1;
    if (direction === "right") targetX += 1;

    onDirectionMove(targetX, targetY);
  };

  return (
    <aside className="side-panel">
      {/* Status Card Block */}
      <div className="status-card">
        <h2>Telemetry</h2>
        
        <div className="status-row">
          <span className="status-label">Robot ID:</span>
          <span className="status-value">{id || "Loading..."}</span>
        </div>

        <div className="status-row">
          <span className="status-label">Battery:</span>
          <div className="battery-container">
            <div className="battery-fill" style={{ width: `${battery}%` }}></div>
          </div>
        </div>

        <div className="status-row">
          <span className="status-label">Status:</span>
          <span className="status-value active">{status}</span>
        </div>

        <div className="status-row position-row">
          <span className="status-label">Position:</span>
          <div className="coordinate-box">
            <div>X: {position.x}</div>
            <div>Y: {position.y}</div>
          </div>
        </div>
      </div>

      {/* Movement D-Pad Control Block */}
      <div>
        <h2>Move robot</h2>
      </div>
      <div className="control-pad">
        <button className="pad-btn up" aria-label="Move Robot Up" onClick={() => handleArrowPress("up")}>↑</button>
        <button className="pad-btn left" aria-label="Move Robot Left" onClick={() => handleArrowPress("left")}>←</button>
        <button className="pad-btn right" aria-label="Move Robot Right" onClick={() => handleArrowPress("right")}>→</button>
        <button className="pad-btn down" aria-label="Move Robot Down" onClick={() => handleArrowPress("down")}>↓</button>
      </div>
    </aside>
  )
}

export default SidePanel
