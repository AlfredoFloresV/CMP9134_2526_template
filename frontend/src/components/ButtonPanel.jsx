function ButtonPanel({ onResetExecuted, onStopExecuted }) {
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

  return (
    <div className="action-buttons">
      <button className="regular-button" onClick={handleResetClick}>
        Reset
      </button>

      <button className="regular-button">
        Sensor
      </button>

      <button className="regular-button">
        View Logs
      </button>

      <button className="emergency-button" onClick={onStopExecuted}>
        Emergency Stop
      </button>
    </div>
  )
}

export default ButtonPanel