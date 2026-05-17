import Header from "./components/Header"
import SidePanel from "./components/SidePanel"

import "./index.css"

function App() {
  return (
    <div className="app">

      <Header />

      <main className="main-content">

        <div className="dashboard-layout">

          <div className="grid-placeholder">
            Grid
          </div>

          <SidePanel />

        </div>

      </main>

    </div>
  )
}

export default App