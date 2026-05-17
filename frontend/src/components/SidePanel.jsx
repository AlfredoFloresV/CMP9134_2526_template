function SidePanel() {
  return (
    <aside className="side-panel">
      {/* Status Card Block */}
      <div className="status-card">
        <h2>Status</h2>
        
        <div className="status-row">
          <span className="status-label">Battery:</span>
          <div className="battery-container">
            {/* We'll control the width dynamically later */}
            <div className="battery-fill" style={{ width: "80%" }}></div>
          </div>
        </div>

        <div className="status-row">
          <span className="status-label">Status:</span>
          <span className="status-value active">Active</span>
        </div>

        <div className="status-row position-row">
          <span className="status-label">Position:</span>
          <div className="coordinate-box">
            <div>X: X</div>
            <div>Y: Y</div>
          </div>
        </div>
      </div>

      {/* Movement D-Pad Control Block */}
      <div>
        <h2>Move robot</h2>
      </div>
      <div className="control-pad">
        <button className="pad-btn up" aria-label="Move Robot Up">↑</button>
        <button className="pad-btn left" aria-label="Move Robot Left">←</button>
        <button className="pad-btn right" aria-label="Move Robot Right">→</button>
        <button className="pad-btn down" aria-label="Move Robot Down">↓</button>
      </div>
    </aside>
  )
}

export default SidePanel