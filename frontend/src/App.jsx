import { useState, useEffect } from "react"
import Header from "./components/Header"
import SidePanel from "./components/SidePanel"
import ButtonPanel from "./components/ButtonPanel"
import Grid from "./components/Grid"
import SensorRadar from "./components/SensorRadar"

import "./index.css"

function App() {
    // ── Session Profile Management State ──────────────────────────────────────
    const [currentUser, setCurrentUser] = useState({
        username: "Guest Client",
        role: "Unauthenticated",
        isAuthenticated: false
    });

    // ── Control Windows Toggles & Input States ────────────────────────────────
    const [showRegisterPopup, setShowRegisterPopup] = useState(false);
    const [loginForm, setLoginForm] = useState({ username: "", password: "" });
    const [registerForm, setRegisterForm] = useState({
        username: "",
        password: "",
        role: "Viewer"
    });
    const [authErrorMessage, setAuthErrorMessage] = useState("");

    // ── Original Scaffolding State ────────────────────────────────────────────
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

    // ── Mission Audit Trail Local Management State ────────────────────────────
    const [logsList, setLogsList] = useState([]);
    const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

    const triggerAlert = (message) => {
        setAlertMessage(message);
        setTimeout(() => {
            setAlertMessage("");
        }, 3000);
    };

    // ── Dropdown Menu Event Processing ────────────────────────────────────────
    const handleHeaderAction = (action) => {
        if (action === "Create User") {
            setAuthErrorMessage("");
            setShowRegisterPopup(true);
        } else if (action === "Logout") {
            setCurrentUser({
                username: "Guest Client",
                role: "Unauthenticated",
                isAuthenticated: false
            });
            setShowRegisterPopup(false);
            setIsLogsModalOpen(false);
        } else if (action === "View Logs") {
            const baseUrl = "http://localhost:8000/api/audit/logs";
            const queryParams = `?requesting_user=${currentUser.username}` +
                `&role=${currentUser.role}`;

            fetch(baseUrl + queryParams)
                .then((res) => {
                    if (!res.ok) {
                        throw new Error("Log clearance rejected by server.");
                    }
                    return res.json();
                })
                .then((data) => {
                    setLogsList(data);
                    setIsLogsModalOpen(true);
                })
                .catch((err) => {
                    console.error(err);
                    triggerAlert(
                        "Authorization failure: Cannot read system audit trail."
                    );
                });
        }
    };

    // ── Database Authorization API Operations ─────────────────────────────────
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setAuthErrorMessage("");
        try {
            const response = await fetch("http://localhost:8000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginForm)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Authentication rejected.");
            }

            setCurrentUser({
                username: data.username,
                role: data.role,
                isAuthenticated: true
            });
            setLoginForm({ username: "", password: "" });
        } catch (err) {
            setAuthErrorMessage(err.message);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setAuthErrorMessage("");
        try {
            const response = await fetch("http://localhost:8000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(registerForm)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Account generation rejected.");
            }

            alert(`Operator account for '${data.username}' has been generated.`);
            setShowRegisterPopup(false);
            setRegisterForm({ username: "", password: "", role: "Viewer" });
        } catch (err) {
            setAuthErrorMessage(err.message);
        }
    };

    // ── Original Telemetry Data sync ──────────────────────────────────────────
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
            .catch((err) => {
                console.error("Error fetching map inside App container:", err);
            })
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
                        status: prev.status === "STOPPED" && data.status === "IDLE"
                            ? "STOPPED"
                            : data.status,
                        position: data.position
                    }))
                }
            })
            .catch((err) => {
                console.error("Error updating telemetry snapshot:", err);
            })
    }

    useEffect(() => {
        refreshStatus()
        const interval = setInterval(refreshStatus, 1000)
        return () => clearInterval(interval)
    }, [])

    const handleMoveRobot = (targetX, targetY) => {
        // Both Viewers and Auditors are locked out from active physical controls
        if (currentUser.role === "Viewer" || currentUser.role === "Auditor") {
            triggerAlert(
                `Access Denied: Your profile role (${currentUser.role}) ` +
                `is restricted to read-only mode.`
            );
            return;
        }

        if (targetX < 0 || targetX > 20 || targetY < 0 || targetY > 20) {
            triggerAlert("Movement failed: Target coordinate is out of bounds.")
            return
        }

        const row = (21 - 1) - targetY;
        if (mapData?.grid?.[row]?.[targetX] === 1) {
            triggerAlert("Movement blocked: Target cell is an obstacle.");
            return;
        }

        const moveUrl = `http://localhost:8000/api/move?x=${targetX}` +
            `&y=${targetY}&username=${currentUser.username}`;

        fetch(moveUrl, { method: "POST" })
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
        if (currentUser.role === "Viewer" || currentUser.role === "Auditor") {
            triggerAlert(
                `Access Denied: Your profile role (${currentUser.role}) ` +
                `cannot reset runtime environments.`
            );
            return;
        }
        setMapKey(prevKey => prevKey + 1);
        refreshStatus()
    };

    const handleStop = () => {
        if (currentUser.role === "Viewer" || currentUser.role === "Auditor") {
            triggerAlert(
                `Access Denied: Your profile role (${currentUser.role}) ` +
                `cannot issue emergency system halts.`
            );
            return;
        }
        fetch("http://localhost:8000/api/status")
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                const { x, y } = data.position;
                const stopUrl = `http://localhost:8000/api/move?x=${x}` +
                    `&y=${y}&username=${currentUser.username}`;

                fetch(stopUrl, { method: "POST" })
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

    // ── Shared Inline Structural Layout Objects ────────────────────────
    const overlayStyle = {
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100000
    };

    const cardStyle = {
        backgroundColor: "#2c2e33",
        color: "#e1e1e1",
        padding: "28px",
        borderRadius: "8px",
        width: "90%",
        maxWidth: "400px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
        fontFamily: "sans-serif"
    };

    const fieldRowStyle = {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        marginBottom: "16px",
        textAlign: "left"
    };

    const labelStyle = {
        fontSize: "13px",
        fontWeight: "bold",
        color: "#b0b5c1"
    };

    const inputStyle = {
        padding: "10px",
        backgroundColor: "#1e2024",
        border: "1px solid #444",
        borderRadius: "4px",
        color: "#ffffff",
        fontSize: "14px"
    };

    const primaryBtnStyle = {
        padding: "12px 16px",
        backgroundColor: "#4a90e2",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "14px",
        width: "100%"
    };

    const errorBannerStyle = {
        backgroundColor: "rgba(255, 68, 68, 0.15)",
        border: "1px solid #ff4444",
        color: "#ff8888",
        padding: "10px",
        borderRadius: "4px",
        fontSize: "13px",
        marginBottom: "16px",
        textAlign: "left"
    };

    // Lock out controls for BOTH Viewers and Auditors
    const isViewOnlyLocked = currentUser.role === "Viewer" ||
        currentUser.role === "Auditor";

    const panelDisabledStyle = isViewOnlyLocked
        ? { pointerEvents: "none", opacity: 0.4 }
        : {};

    return (
        <div className="app">
            <Header currentUser={currentUser} onMenuAction={handleHeaderAction} />

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

                    {/* Dims and freezes direction clicks for Viewers and Auditors */}
                    <div style={panelDisabledStyle}>
                        <SidePanel
                            telemetry={telemetry}
                            onDirectionMove={handleMoveRobot}
                        />
                    </div>
                </div>

                {/* Role-Based Active Button Controller Layout */}
                <ButtonPanel
                    userRole={currentUser.role}
                    onResetExecuted={handleReset}
                    onStopExecuted={handleStop}
                    onSensorClick={handleSensor}
                    onViewLogsClick={() => handleHeaderAction("View Logs")}
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
                        maxWidth: "500px",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
                    }}>
                        <h2 style={{
                            marginTop: 0,
                            marginBottom: "16px",
                            borderBottom: "1px solid #444",
                            paddingBottom: "12px",
                            textAlign: "center"
                        }}>
                            Live Sensor Diagnostics
                        </h2>

                        <SensorRadar data={sensorData} />

                        <div style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "20px",
                            marginTop: "10px",
                            fontSize: "14px"
                        }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                <div style={{
                                    width: "12px",
                                    height: "12px",
                                    backgroundColor: "#ff4444",
                                    borderRadius: "50%"
                                }}></div>
                                Cardinal Sensors
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                <div style={{
                                    width: "12px",
                                    height: "12px",
                                    backgroundColor: "rgba(74, 144, 226, 0.5)",
                                    border: "1px solid #4a90e2"
                                }}></div>
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

            {/* ── NON-BLOCKING OPERATIONAL AUDIT LOGS OVERLAY PANEL ── */}
            {isLogsModalOpen && (
                <div style={{
                    position: "fixed",
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "transparent",
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
                        width: "95%",
                        maxWidth: "850px",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.75)",
                        fontFamily: "sans-serif"
                    }}>
                        <h2 style={{
                            marginTop: 0,
                            marginBottom: "16px",
                            borderBottom: "1px solid #444",
                            paddingBottom: "12px",
                            textAlign: "center"
                        }}>
                            System Mission Audit Logs
                        </h2>

                        <div style={{
                            overflowY: "auto",
                            maxHeight: "350px",
                            backgroundColor: "#1e2024",
                            borderRadius: "4px",
                            border: "1px solid #444"
                        }}>
                            <table style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                fontSize: "14px",
                                textAlign: "left"
                            }}>
                                <thead>
                                    <tr style={{
                                        backgroundColor: "#151619",
                                        color: "#b0b5c1",
                                        position: "sticky",
                                        top: 0,
                                        borderBottom: "2px solid #444"
                                    }}>
                                        <th style={{ padding: "12px 8px" }}>ID</th>
                                        <th style={{ padding: "12px 8px" }}>Timestamp</th>
                                        <th style={{ padding: "12px 8px" }}>Operator</th>
                                        <th style={{ padding: "12px 8px" }}>Action</th>
                                        <th style={{ padding: "12px 8px" }}>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logsList.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                style={{
                                                    padding: "20px",
                                                    textAlign: "center",
                                                    color: "#777"
                                                }}
                                            >
                                                No mission entries recorded.
                                            </td>
                                        </tr>
                                    ) : (
                                        logsList.map((log) => (
                                            <tr
                                                key={log.id}
                                                style={{
                                                    borderBottom: "1px solid #2a2c30"
                                                }}
                                            >
                                                <td style={{ padding: "10px 8px", color: "#4a90e2" }}>
                                                    {log.id}
                                                </td>
                                                <td style={{ padding: "10px 8px", color: "#888" }}>
                                                    {log.timestamp}
                                                </td>
                                                <td style={{ padding: "10px 8px", fontWeight: "bold" }}>
                                                    {log.username}
                                                </td>
                                                <td style={{ padding: "10px 8px" }}>
                                                    <span style={{
                                                        padding: "3px 6px",
                                                        borderRadius: "3px",
                                                        backgroundColor: "#151619",
                                                        fontSize: "12px",
                                                        color: "#ff8888"
                                                    }}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "10px 8px", color: "#b0b5c1" }}>
                                                    {log.details}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <button
                            onClick={() => setIsLogsModalOpen(false)}
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
                                width: "200px"
                            }}
                        >
                            Close Audit Logs
                        </button>
                    </div>
                </div>
            )}

            {/* ── MANDATORY SECURITY AUTH WALL OVERLAY ── */}
            {!currentUser.isAuthenticated && (
                <div style={overlayStyle}>
                    <div style={cardStyle}>
                        <h2 style={{
                            marginTop: 0,
                            marginBottom: "20px",
                            borderBottom: "1px solid #444",
                            paddingBottom: "12px",
                            textAlign: "center",
                            fontSize: "20px"
                        }}>
                            Login
                        </h2>
                        {authErrorMessage && (
                            <div style={errorBannerStyle}>{authErrorMessage}</div>
                        )}
                        <form onSubmit={handleLoginSubmit}>
                            <div style={fieldRowStyle}>
                                <label style={labelStyle}>Username</label>
                                <input
                                    type="text"
                                    required
                                    style={inputStyle}
                                    value={loginForm.username}
                                    onChange={(e) => setLoginForm({
                                        ...loginForm,
                                        username: e.target.value
                                    })}
                                />
                            </div>
                            <div style={fieldRowStyle}>
                                <label style={labelStyle}>Password</label>
                                <input
                                    type="password"
                                    required
                                    style={inputStyle}
                                    value={loginForm.password}
                                    onChange={(e) => setLoginForm({
                                        ...loginForm,
                                        password: e.target.value
                                    })}
                                />
                            </div>
                            <button type="submit" style={primaryBtnStyle}>
                                Authenticate
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── PROFILE PROVISIONING OVERLAY (Commander Only) ── */}
            {showRegisterPopup && currentUser.role === "Commander" && (
                <div style={overlayStyle}>
                    <div style={cardStyle}>
                        <h2 style={{
                            marginTop: 0,
                            marginBottom: "20px",
                            borderBottom: "1px solid #444",
                            paddingBottom: "12px",
                            textAlign: "center",
                            fontSize: "20px"
                        }}>
                            Provision New Operator
                        </h2>
                        {authErrorMessage && (
                            <div style={errorBannerStyle}>{authErrorMessage}</div>
                        )}
                        <form onSubmit={handleRegisterSubmit}>
                            <div style={fieldRowStyle}>
                                <label style={labelStyle}>Username</label>
                                <input
                                    type="text"
                                    required
                                    style={inputStyle}
                                    value={registerForm.username}
                                    onChange={(e) => setRegisterForm({
                                        ...registerForm,
                                        username: e.target.value
                                    })}
                                />
                            </div>
                            <div style={fieldRowStyle}>
                                <label style={labelStyle}>Password</label>
                                <input
                                    type="password"
                                    required
                                    style={inputStyle}
                                    value={registerForm.password}
                                    onChange={(e) => setRegisterForm({
                                        ...registerForm,
                                        password: e.target.value
                                    })}
                                />
                            </div>
                            <div style={fieldRowStyle}>
                                <label style={labelStyle}>Clearance Level</label>
                                <select
                                    style={inputStyle}
                                    value={registerForm.role}
                                    onChange={(e) => setRegisterForm({
                                        ...registerForm,
                                        role: e.target.value
                                    })}
                                >
                                    <option value="Viewer">Viewer</option>
                                    <option value="Commander">Commander</option>
                                    <option value="Auditor">Auditor</option>
                                </select>
                            </div>
                            <div style={{
                                display: "flex",
                                gap: "12px",
                                marginTop: "16px"
                            }}>
                                <button type="submit" style={primaryBtnStyle}>
                                    Create Account
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowRegisterPopup(false)}
                                    style={{
                                        padding: "12px 16px",
                                        backgroundColor: "transparent",
                                        color: "#e1e1e1",
                                        border: "1px solid #444",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontWeight: "bold",
                                        fontSize: "14px",
                                        width: "100%"
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App
