import { useState, useEffect } from "react"
import Header from "./components/Header"
import SidePanel from "./components/SidePanel"
import ButtonPanel from "./components/ButtonPanel"
import Grid from "./components/Grid"

import "./index.css"

function App() {
  // Central source of truth for robot telemetry across the layout
  const [telemetry, setTelemetry] = useState({
    battery: 100,
    status: "IDLE",
    position: { x: 0, y: 0 }
  })

  // We use this state to force the Grid to remount and re-fetch the map
  const [mapKey, setMapKey] = useState(0);

  // Shared state to hold map layouts so movement routers can detect obstacles
  const [mapData, setMapData] = useState(null);

  // Notification state to log illegal movements on the screen
  const [alertMessage, setAlertMessage] = useState("");

  // Helper function to trigger a timed UI alert log
  const triggerAlert = (message) => {
    setAlertMessage(message);
    // Automatically clear the alert notification after 3 seconds
    setTimeout(() => {
      setAlertMessage("");
    }, 3000);
  };

  // Fetch the map data coordinate matrix whenever mapKey updates (on mount or Reset)
  useEffect(() => {
    fetch("http://localhost:8000/api/map")
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok")
        return response.json()
      })
      .then((data) => {
        if (!data.error) {
          setMapData(data)
        }
      })
      .catch((err) => console.error("Error fetching map inside App container:", err))
  }, [mapKey])

  const refreshStatus = () => {
    fetch("http://localhost:8000/api/status")
      .then((res) => {
        if (!res.ok) throw new Error("Telemetry sync failed")
        return res.json()
      })
      .then((data) => {
        if (!data.error) {
          setTelemetry({
            battery: data.battery,
            status: data.status,
            position: data.position
          })
        }
      })
      .catch((err) => console.error("Error updating telemetry:", err))
  }

  // Poll for telemetry status data continuously every 1 second
  useEffect(() => {
    refreshStatus()
    const interval = setInterval(refreshStatus, 1000)
    return () => clearInterval(interval)
  }, [])

  // Consolidated movement router handling query string routing parameters
  const handleMoveRobot = (targetX, targetY) => {
    if (targetX < 0 || targetX > 20 || targetY < 0 || targetY > 20) {
      triggerAlert("Movement failed: Target coordinate is out of bounds.")
      return
    }

    const startX = telemetry.position.x;
    const startY = telemetry.position.y;

    // Path Obstacle Guard Clause: Check all cells along the movement path
    if (startX === targetX) {
      // Vertical line corridor verification loop
      const minY = Math.min(startY, targetY);
      const maxY = Math.max(startY, targetY);
      for (let y = minY; y <= maxY; y++) {
        const row = (21 - 1) - y;
        if (mapData?.grid?.[row]?.[targetX] === 1) {
          triggerAlert("Movement blocked: Path contains an obstacle.");
          return;
        }
      }
    } else if (startY === targetY) {
      // Horizontal line corridor verification loop
      const minX = Math.min(startX, targetX);
      const maxX = Math.max(startX, targetX);
      for (let x = minX; x <= maxX; x++) {
        const row = (21 - 1) - targetY;
        if (mapData?.grid?.[row]?.[x] === 1) {
          triggerAlert("Movement blocked: Path contains an obstacle.");
          return;
        }
      }
    } else {
      // Multi-axis direct grid click selection path verification
      const destRow = (21 - 1) - targetY;
      if (mapData?.grid?.[destRow]?.[targetX] === 1) {
        triggerAlert("Movement blocked: Target cell is an obstacle.");
        return;
      }

      // Check standard path traversal mapping (horizontal segment then vertical segment)
      let pathBlocked = false;
      const minX = Math.min(startX, targetX);
      const maxX = Math.max(startX, targetX);
      for (let x = minX; x <= maxX; x++) {
        const row = (21 - 1) - startY;
        if (mapData?.grid?.[row]?.[x] === 1) pathBlocked = true;
      }
      const minY = Math.min(startY, targetY);
      const maxY = Math.max(startY, targetY);
      for (let y = minY; y <= maxY; y++) {
        const row = (21 - 1) - y;
        if (mapData?.grid?.[row]?.[targetX] === 1) pathBlocked = true;
      }

      if (pathBlocked) {
        triggerAlert("Movement blocked: Path contains an obstacle.");
        return;
      }
    }

    fetch(`http://localhost:8000/api/move?x=${targetX}&y=${targetY}`, {
      method: "POST"
    })
      .then((res) => {
        if (!res.ok) throw new Error("Movement request failed")
        return res.json()
      })
      .then((data) => {
        if (data.error) {
          triggerAlert(`Robot rejected move: ${data.error}`)
        } else {
          refreshStatus() // Force instant visual sync on success
        }
      })
      .catch((err) => {
        console.error("Network interface error moving robot:", err)
        triggerAlert("Connection error: Could not reach the server.")
      })
  }

  const handleReset = () => {
    // Incrementing the key forces the Grid component to reload
    setMapKey(prevKey => prevKey + 1);
    refreshStatus()
  };

  return (
    <div className="app">

      <Header />

      {/* Standalone alert banner block for logging illegal movements */}
      {alertMessage && (
        <div style={{
          padding: "12px",
          backgroundColor: "#ff4444",
          color: "#ffffff",
          textAlign: "center",
          fontWeight: "bold",
          fontSize: "14px",
          letterSpacing: "0.5px"
        }}>
          {alertMessage}
        </div>
      )}

      <main className="main-content">

        <div className="dashboard-layout">

          <div className="grid-placeholder">
            {/* The key prop connects the reset action to the Grid */}
            <Grid 
              key={mapKey} 
              robotPosition={telemetry.position} 
              onCellClick={handleMoveRobot} 
              mapData={mapData}
            />
          </div>

          <SidePanel 
            telemetry={telemetry} 
            onDirectionMove={handleMoveRobot} 
          />

        </div>

        {/* Pass the reset handler down to the buttons */}
        <ButtonPanel onResetExecuted={handleReset} />

      </main>

    </div>
  )
}

export default App