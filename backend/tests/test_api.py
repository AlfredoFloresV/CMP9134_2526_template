from fastapi.testclient import TestClient
from main import app  # Import your actual FastAPI app

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
