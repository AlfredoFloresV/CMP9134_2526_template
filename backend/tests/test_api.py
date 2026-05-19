from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# Mock the database setup sequence completely before main app components load
with patch("dbConn.get_db_connection", return_value=MagicMock()):
    from main import app

client = TestClient(app)


def test_get_status():
    """Verify the /api/status endpoint responds."""
    response = client.get("/api/status")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)


def test_get_map():
    """Verify the /api/map endpoint responds."""
    response = client.get("/api/map")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)


def test_get_sensor():
    """Verify the /api/sensor endpoint responds."""
    response = client.get("/api/sensor")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)


def test_post_move():
    """Verify the /api/move endpoint accepts coordinates."""
    response = client.post("/api/move?x=5&y=5")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)


def test_post_reset():
    """Verify the /api/reset endpoint responds."""
    response = client.post("/api/reset")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)


# ── New Critical RBAC & Security Integration Tests ──────────────────────────


@patch("dbConn.get_db_connection")
def test_fetch_mission_audit_trail_authorized(mock_get_db):
    """Verify an Auditor can pull the log trail payload without obstacles."""
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = [
        (1, "2026-05-19 21:00:00", "commander", "LOGIN", "Success")
    ]
    mock_conn.cursor.return_value = mock_cursor
    mock_get_db.return_value = mock_conn

    url = "/api/audit/logs?requesting_user=auditor_alice&role=Auditor"
    response = client.get(url)

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_fetch_mission_audit_trail_access_denied():
    """Verify that users with no clearance receive a 403 Forbidden."""
    url = "/api/audit/logs?requesting_user=viewer_bob&role=Viewer"
    response = client.get(url)

    assert response.status_code == 403
    assert "Access Forbidden" in response.json()["detail"]


@patch("dbConn.get_db_connection")
def test_preseeded_account_login_failure(mock_get_db):
    """Verify the authentication system catches bad credentials."""
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = ("mocked_correct_hash_signature",
                                         "Commander")
    mock_conn.cursor.return_value = mock_cursor
    mock_get_db.return_value = mock_conn

    payload = {"username": "commander", "password": "wrong_password_xyz"}
    response = client.post("/api/auth/login", json=payload)

    assert response.status_code == 401
    assert "Invalid credential combination" in response.json()["detail"]
