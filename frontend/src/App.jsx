import { useState, useEffect } from "react"
import Header from "./components/Header"
import SidePanel from "./components/SidePanel"
import ButtonPanel from "./components/ButtonPanel"
import Grid from "./components/Grid"
import SensorRadar from "./components/SensorRadar"

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
  
  const [sensorData, setSensorData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleSensor = () => {
    fetch("http://localhost:8000/api/sensor")
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setSensorData(data);
        setIsModalOpen(true);
      })
      .catch(err => {
        console.error("Sensor read failed:", err);
        triggerAlert("Failed to retrieve sensor data.");
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

        <ButtonPanel 
          onResetExecuted={handleReset} 
          onStopExecuted={handleStop} 
          onSensorClick={handleSensor}
        />
      </main>

      {/* --- Sensor Modal Overlay --- */}
      {isModalOpen && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: "#2c2e33",
            color: "#e1e1e1",
            padding: "24px",
            borderRadius: "8px",
            width: "90%",
            maxWidth: "500px", // slightly narrower to fit the radar nicely
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
          }}>
            <h2 style={{ marginTop: 0, marginBottom: "16px", borderBottom: "1px solid #444", paddingBottom: "12px", textAlign: "center" }}>
              Live Sensor Diagnostics
            </h2>
            
            {/* The raw JSON pre tag has been swapped out for the visual radar */}
            <SensorRadar data={sensorData} />

            {/* A small legend to explain the colors */}
            <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "10px", fontSize: "14px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "12px", height: "12px", backgroundColor: "#ff4444", borderRadius: "50%" }}></div>
                Cardinal Sensors
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "12px", height: "12px", backgroundColor: "rgba(74, 144, 226, 0.5)", border: "1px solid #4a90e2" }}></div>
                Lidar Sweep
              </span>
            </div>

            <button 
              onClick={() => setIsModalOpen(false)}
              style={{
                marginTop: "20px",
                padding: "10px 16px",
                backgroundColor: "#4a90e2",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
                alignSelf: "center",
                width: "100%"
              }}
            >
              Close Diagnostics
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default App