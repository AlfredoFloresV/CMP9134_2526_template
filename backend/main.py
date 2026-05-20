"""
Ground Control Station — FastAPI application entry point.
=========================================================

This module is the heart of the backend.  FastAPI reads this file when the
server starts and uses the `app` object defined here to handle every incoming
HTTP request.
"""

import logging
import os
import asyncio
import hashlib
from typing import Optional, List, Literal

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from robot_client import robot, RobotConnectionError
from legacy_stats import router as legacy_router

# ── Import database initialization function ─────────────────────────────────
from dbConn import init_db

# ── Configuration from environment variables ───────────────────────────────
ROBOT_API_URL = os.getenv("ROBOT_API_URL", "http://localhost:5000")
LOG_LEVEL = os.getenv("LOG_LEVEL", "info")

ENABLE_ADVANCED_STATS = os.getenv(
    "FF_ADVANCED_STATS", "false").lower() == "true"

# ── Logging setup ──────────────────────────────────────────────────────────
logging.basicConfig(level=LOG_LEVEL.upper())
logger = logging.getLogger(__name__)


# ── Pydantic Data Models (Workshop Task 5 & 13 Aligned) ─────────────────────


# User Account Schema for Registration (a)
class UserAccount(BaseModel):
    id: Optional[int] = None
    username: str
    password: str  # Plain text over wire transit
    role: Literal["Commander", "Viewer", "Auditor"]


# User Login Request Input Model (b)
class UserLoginRequest(BaseModel):
    username: str
    password: str


# System Operational Log Schema (d)
class MissionLogEntry(BaseModel):
    id: Optional[int] = None
    timestamp: Optional[str] = None
    username: str
    action: str
    details: Optional[str] = None


# ── Application factory ────────────────────────────────────────────────────
app = FastAPI(
    title="Ground Control Station",
    description="CMP9134 — Robot Management System scaffold",
    version="0.1.0",
)

app.include_router(legacy_router)


# ── Database Bootstrapping Hook ─────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    """Triggers verification and creation of tables on application launch."""
    logger.info("Application starting up. Verifying core system tables...")
    try:
        init_db()
    except Exception as exc:
        logger.error("CRITICAL: Database initialization failed: %s", exc)


# ── CORS middleware ────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Password Hashing Helper ────────────────────────────────────────────────
def secure_hash(text: str) -> str:
    """Computes a SHA-256 signature string to avoid plain-text storage."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


# ── Internal Audit Logging Utility (c) ──────────────────────────────────────
def emit_audit_log(username: str, action: str, details: str = None):
    """Internal helper to drop structured operational logs to the database."""
    from dbConn import get_db_connection

    connection = get_db_connection()
    cursor = connection.cursor()
    query = (
        "INSERT INTO mission_logs (username, action, details) "
        "VALUES (%s, %s, %s)"
    )
    try:
        cursor.execute(query, (username, action, details))
        connection.commit()
    except Exception as error:
        connection.rollback()
        logger.error(
            "Failed to commit background audit trail record: %s", error)
    finally:
        cursor.close()


# ── Authentication & RBAC Endpoints (a, b & d) ──────────────────────────────


@app.post("/api/auth/register", response_model=UserAccount)
def register_user(user: UserAccount):
    """Creates a user account profile inside the database (a)."""
    from dbConn import get_db_connection

    connection = get_db_connection()
    cursor = connection.cursor()

    # Pre-flight check: Ensure user doesn't already exist (Task 15)
    cursor.execute("SELECT id FROM users WHERE username = %s",
                   (user.username,))
    if cursor.fetchone() is not None:
        cursor.close()
        raise HTTPException(
            status_code=400,
            detail=(f"Registration failed: '{user.username}' "
                    f"already exists."),
        )

    query = (
        "INSERT INTO users (username, password_hash, role) "
        "VALUES (%s, %s, %s)"
    )
    hashed_password = secure_hash(user.password)

    try:
        cursor.execute(query, (user.username, hashed_password, user.role))
        connection.commit()
        new_id = cursor.lastrowid
    except Exception as error:
        connection.rollback()
        cursor.close()
        raise HTTPException(
            status_code=400,
            detail=f"Could not create user account: {error}",
        )
    finally:
        cursor.close()

    return UserAccount(
        id=new_id, username=user.username, password="[PROTECTED]",
        role=user.role
    )


@app.post("/api/auth/login")
def login_session(request: UserLoginRequest):
    """Verifies signatures against stored records to log in (b)."""
    from dbConn import get_db_connection

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT password_hash, role " "FROM users WHERE username = %s",
        (request.username,),
    )
    row = cursor.fetchone()
    cursor.close()

    if row is None:
        raise HTTPException(
            status_code=404, detail="Identity profile not found.")

    stored_hash, role = row[0], row[1]
    computed_hash = secure_hash(request.password)

    if computed_hash != stored_hash:
        raise HTTPException(
            status_code=401, detail="Invalid credential combination.")

    emit_audit_log(
        request.username, "LOGIN",
        f"User logged in successfully with {role} role."
    )

    return {
        "status": "authenticated",
        "username": request.username,
        "role": role,
        "message": f"Welcome back, {request.username} ({role}).",
    }


@app.get("/api/audit/logs", response_model=List[MissionLogEntry])
def fetch_mission_audit_trail(requesting_user: str, role: str):
    """Returns sorted system logs with restricted access checking (d)."""
    # Strict Role-Based Access Control Rule
    if role not in ["Commander", "Auditor"]:
        raise HTTPException(
            status_code=403,
            detail=(
                "Access Forbidden: Profile holds insufficient clearan"
                "ce to review logs."
            ),
        )

    from dbConn import get_db_connection

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT id, timestamp, username, action, details "
        "FROM mission_logs ORDER BY timestamp DESC"
    )
    rows = cursor.fetchall()
    cursor.close()

    return [
        MissionLogEntry(
            id=row[0],
            timestamp=str(row[1]),
            username=row[2],
            action=row[3],
            details=row[4],
        )
        for row in rows
    ]


# ── Health check ───────────────────────────────────────────────────────────
@app.get("/health", include_in_schema=False)
def health():
    return {"status": "ok"}


# ── Math Safety Checks ─────────────────────────────────────────────────────
def is_safe_move(x: int, y: int, grid: list) -> bool:
    """Returns True if metrics are inside grid boundaries and unblocked."""
    if not (0 <= x <= 20 and 0 <= y <= 20):
        return False
    top_row_index = len(grid) - 1
    return grid[top_row_index - y][x] == 0


# ── Robot Control Endpoints with Automated Auditing (c) ─────────────────────


@app.get("/api/status")
async def get_status():
    """Return the current robot status (position, battery level, state)."""
    try:
        return await robot.get_status()
    except RobotConnectionError as exc:
        logger.warning("Could not reach robot API: %s", exc)
        return {"error": str(exc)}


@app.get("/api/experimental_stats")
def get_experimental_stats():
    if not ENABLE_ADVANCED_STATS:
        return {"error": "Feature not yet available."}, 404
    return {"status": "success", "data": "Top secret advanced stats!"}


@app.post("/api/move")
async def move(x: int, y: int, username: str = "anonymous"):
    """Send the robot to position (x, y) and log the action automatically."""
    try:
        # Fetch map to validate move safety locally before dispatching
        grid_data = await robot.get_map()
        if "grid" in grid_data and not is_safe_move(x, y, grid_data["grid"]):
            emit_audit_log(
                username,
                "MOVE_REJECTED",
                f"Blocked unsafe coordinates request: ({x}, {y})",
            )
            return {
                "error": (
                    f"Target position ({x}, {y}) contains an obstacle "
                    f"or is invalid."
                )
            }

        response = await robot.move(x, y)

        # Log successful movement tracking entry dynamically (c)
        emit_audit_log(
            username, "MOVE_COMMAND",
            f"Dispatched robot to coordinates: ({x},{y})"
        )
        return response
    except RobotConnectionError as exc:
        logger.warning("Move command failed: %s", exc)
        return {"error": str(exc)}


@app.websocket("/ws/telemetry")
async def ws_telemetry(websocket: WebSocket):
    """Stream live sensor data to a connected browser client."""
    await websocket.accept()
    try:
        while True:
            data = await robot.get_status()
            await websocket.send_json(data)
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        logger.info("Telemetry client disconnected")


@app.get("/api/map")
async def get_map():
    """Return the map grid layout."""
    try:
        return await robot.get_map()
    except RobotConnectionError as exc:
        logger.warning("Could not reach robot API for map: %s", exc)
        return {"error": str(exc)}


@app.post("/api/reset")
async def reset_simulation(username: str = "anonymous"):
    """Reset the world state environment and track initialization."""
    try:
        response = await robot.reset()

        emit_audit_log(
            username,
            "ENVIRONMENT_RESET",
            "Simulation environment state was forced back to defaults.",
        )
        return response
    except RobotConnectionError as exc:
        return {"error": str(exc)}


@app.get("/api/sensor")
async def get_sensor():
    """Return live sensor matrix from the virtual robot."""
    try:
        return await robot.get_sensor_data()
    except RobotConnectionError as exc:
        logger.warning("Sensor diagnostics unreachable: %s", exc)
        return {"error": str(exc)}
