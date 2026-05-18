import { useState, useEffect } from "react"
import Header from "./components/Header"
import SidePanel from "./components/SidePanel"
import ButtonPanel from "./components/ButtonPanel"
import Grid from "./components/Grid"

import "./index.css"

function App() {
  const [telemetry, setTelemetry] = useState({
    id: "",
    battery: 100,
    status: "IDLE",
    position: { x: 0, y: 0 }
  })

  const [mapKey, setMapKey] = useState(0);
  const [mapData, setMapData] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");

  const triggerAlert = (message) => {
    setAlertMessage(message);
    setTimeout(() => {
      setAlertMessage("");
    }, 3000);
  };

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
          // If we manually set the status to STOPPED via the E-Stop, we don't want the 
          // 1-second polling loop to instantly overwrite it back to IDLE on the next tick.
          setTelemetry(prev => ({
            id: data.id,
            battery: data.battery,
            status: prev.status === "STOPPED" && data.status === "IDLE" ? "STOPPED" : data.status,
            position: data.position
          }))
        }
      })
      .catch((err) => console.error("Error updating telemetry snapshot:", err))
  }

  useEffect(() => {
    refreshStatus()
    const interval = setInterval(refreshStatus, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleMoveRobot = (targetX, targetY) => {
    if (targetX < 0 || targetX > 20 || targetY < 0 || targetY > 20) {
      triggerAlert("Movement failed: Target coordinate is out of bounds.")
      return
    }

    const row = (21 - 1) - targetY;
    if (mapData?.grid?.[row]?.[targetX] === 1) {
      triggerAlert("Movement blocked: Target cell is an obstacle.");
      return;
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
          // Clear the STOPPED status if a new valid movement command is sent
          setTelemetry(prev => ({ ...prev, status: "MOVING" }));
        }
        refreshStatus()
      })
      .catch((err) => {
        console.error("Network interface error moving robot:", err)
        triggerAlert("Connection error: Could not reach the server.")
        refreshStatus()
      })
  }

  const handleReset = () => {
    setMapKey(prevKey => prevKey + 1);
    refreshStatus()
  };

  // E-Stop Logic: GET current position, POST move to that exact cell
  const handleStop = () => {
    fetch("http://localhost:8000/api/status")
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        const { x, y } = data.position;

        fetch(`http://localhost:8000/api/move?x=${x}&y=${y}`, {
          method: "POST"
        })
        .then(() => {
          // Force the UI status to read STOPPED
          setTelemetry(prev => ({
            ...prev,
            status: "STOPPED",
            position: { x, y }
          }));
          triggerAlert("Emergency Stop Activated!");
        });
      })
      .catch(err => {
        console.error("E-Stop failed:", err);
        triggerAlert("Failed to execute Emergency Stop.");
      });
  };

  return (
    <div className="app">

      <Header />

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

        <ButtonPanel onResetExecuted={handleReset} onStopExecuted={handleStop} />

      </main>

    </div>
  )
}

export default App