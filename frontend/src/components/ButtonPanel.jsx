function ButtonPanel() {
  return (
    <div className="action-buttons">

      <button className="regular-button">
        Reset
      </button>

      <button className="regular-button">
        Sensor
      </button>

      <button className="regular-button">
        View Logs
      </button>

      <button className="emergency-button">
        Emergency Stop
      </button>

    </div>
  )
}

export default ButtonPanel