function ButtonPanel({
  userRole,
  onResetExecuted,
  onStopExecuted,
  onSensorClick,
  onViewLogsClick
}) {
  const handleResetClick = () => {
    fetch("http://localhost:8000/api/reset", {
      method: "POST",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to reset");
        return res.json();
      })
      .then((data) => {
        if (!data.error && onResetExecuted) {
          onResetExecuted();
        }
      })
      .catch((err) => console.error("Reset error:", err));
  };

  // Viewers and Auditors are prohibited from execution controls
  const isControlDisabled = userRole === "Viewer" || userRole === "Auditor";

  // ONLY the Auditor is permitted to trigger the log view panel interface
  const isLogDisabled = userRole !== "Auditor";

  return (
    <div className="action-buttons">
      <button
        className="regular-button"
        onClick={handleResetClick}
        disabled={isControlDisabled}
        style={isControlDisabled ? { opacity: 0.4, cursor: "not-allowed" } : {}}
      >
        Reset
      </button>

      <button className="regular-button" onClick={onSensorClick}>
        Sensor
      </button>

      <button
        className="regular-button"
        onClick={onViewLogsClick}
        disabled={isLogDisabled}
        style={isLogDisabled ? { opacity: 0.4, cursor: "not-allowed" } : {}}
      >
        View Logs
      </button>

      <button
        className="emergency-button"
        onClick={onStopExecuted}
        disabled={isControlDisabled}
        style={isControlDisabled ? { opacity: 0.4, cursor: "not-allowed" } : {}}
      >
        Emergency Stop
      </button>
    </div>
  );
}

export default ButtonPanel;