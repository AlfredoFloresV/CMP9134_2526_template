function Header() {
  return (
    <header className="header">
      <div className="header-left">

        <div className="logo">
          {/* img here*/}
        </div>

        <div className="menu">
          <select>
            <option>Dashboard</option>
            <option>Telemetry</option>
            <option>Mission logs</option>
            <option>Settings</option>
          </select>
        </div>

      </div>

      <div className="user-info">

        <div className="avatar"></div>

        <div className="user-text">
          <div className="user-name">
            User name
          </div>

          <div className="user-role">
            Role
          </div>
        </div>

      </div>
    </header>
  )
}

export default Header