import { useState } from "react"
import Header from "./components/Header"
import SidePanel from "./components/SidePanel"
import ButtonPanel from "./components/ButtonPanel"
import Grid from "./components/Grid"

import "./index.css"

function App() {
  // We use this state to force the Grid to remount and re-fetch the map
  const [mapKey, setMapKey] = useState(0);

  const handleReset = () => {
    // Incrementing the key forces the Grid component to reload
    setMapKey(prevKey => prevKey + 1);
  };

  return (
    <div className="app">

      <Header />

      <main className="main-content">

        <div className="dashboard-layout">

          <div className="grid-placeholder">
            {/* The key prop connects the reset action to the Grid */}
            <Grid key={mapKey} />
          </div>

          <SidePanel />

        </div>

        {/* Pass the reset handler down to the buttons */}
        <ButtonPanel onResetExecuted={handleReset} />

      </main>

    </div>
  )
}

export default App