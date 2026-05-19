function SensorRadar({ data }) {
  if (!data || !data.lidar) return <div style={{ color: "white" }}>No sensor data available.</div>;

  const size = 350;
  const center = size / 2;
  const maxDist = 10; // The max range of the lidar
  const scale = (size / 2 - 25) / maxDist; // Leaves padding around the edges

  // Helper function to map degrees and distance to X/Y coordinates on the screen
  const getCoords = (degree, distance) => {
    // Convert degree to radians (0 degrees is North/Up)
    const rad = (degree * Math.PI) / 180;
    return {
      x: center + distance * scale * Math.sin(rad),
      y: center - distance * scale * Math.cos(rad), // SVG Y-axis is inverted (goes down)
    };
  };

  // Connect all 360 lidar data points into a single SVG polygon shape
  const lidarPoints = data.lidar.map((dist, deg) => {
    const { x, y } = getCoords(deg, dist);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
      <svg width={size} height={size} style={{ backgroundColor: '#1e1e20', borderRadius: '50%', border: '2px solid #444' }}>
        
        {/* Draw concentric distance rings (2, 4, 6, 8, 10 units) */}
        {[2, 4, 6, 8, 10].map(r => (
          <circle key={r} cx={center} cy={center} r={r * scale} fill="none" stroke="#333" strokeDasharray="4 4" />
        ))}
        
        {/* Draw crosshair axes */}
        <line x1={center} y1={0} x2={center} y2={size} stroke="#333" />
        <line x1={0} y1={center} x2={size} y2={center} stroke="#333" />

        {/* Draw the Lidar Sweep Area (Blue) */}
        <polygon points={lidarPoints} fill="rgba(74, 144, 226, 0.3)" stroke="#4a90e2" strokeWidth="2" />

        {/* Draw the 4 Cardinal Sensors (Red Dots) */}
        <circle cx={getCoords(0, data.N).x} cy={getCoords(0, data.N).y} r="6" fill="#ff4444" />
        <circle cx={getCoords(180, data.S).x} cy={getCoords(180, data.S).y} r="6" fill="#ff4444" />
        <circle cx={getCoords(90, data.E).x} cy={getCoords(90, data.E).y} r="6" fill="#ff4444" />
        <circle cx={getCoords(270, data.W).x} cy={getCoords(270, data.W).y} r="6" fill="#ff4444" />

        {/* Draw the Robot (White Dot in Center) */}
        <circle cx={center} cy={center} r="5" fill="#ffffff" />
        
        {/* Labels */}
        <text x={center - 5} y={15} fill="#777" fontSize="12" fontWeight="bold">N</text>
        <text x={center - 5} y={size - 8} fill="#777" fontSize="12" fontWeight="bold">S</text>
        <text x={size - 15} y={center + 4} fill="#777" fontSize="12" fontWeight="bold">E</text>
        <text x={5} y={center + 4} fill="#777" fontSize="12" fontWeight="bold">W</text>
      </svg>
    </div>
  );
}

export default SensorRadar;