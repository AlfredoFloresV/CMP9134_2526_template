import React from "react"

function Header({ currentUser, onMenuAction }) {
  const handleMenuChange = (e) => {
    const action = e.target.value;
    onMenuAction(action);
    e.target.value = "Default"; // Resets selection context
  }

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          {/* img here*/}
        </div>

        <div className="menu">
          <select aria-label="Navigation Menu" defaultValue="Default" onChange={handleMenuChange}>
            <option value="Default" disabled hidden>Navigation Menu</option>

            {/* Accessible Exclusively by Auditors */}
            {currentUser.isAuthenticated && currentUser.role === "Auditor" && (
              <option value="View Logs">Mission logs</option>
            )}

            {/* Accessible Exclusively by Commanders */}
            {currentUser.isAuthenticated && currentUser.role === "Commander" && (
              <option value="Create User">Create User</option>
            )}

            {currentUser.isAuthenticated && <option value="Logout">Logout</option>}
          </select>
        </div>
      </div>

      <div className="user-info">
        <div className="avatar"></div>
        <div className="user-text">
          <div className="user-name">
            {currentUser.username}
          </div>
          <div className="user-role">
            {currentUser.role}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header