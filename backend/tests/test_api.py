from fastapi.testclient import TestClient
from main import app  # Import your actual FastAPI app

# Create a test client that can simulate HTTP requests to your app without running a live server
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
    """Verify the /api/move endpoint accepts valid coordinates."""
    # We pass x and y as query parameters because that is how your main.py route is defined
    response = client.post("/api/move?x=5&y=5")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)

def test_post_reset():
    """Verify the /api/reset endpoint responds."""
    response = client.post("/api/reset")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)

# We will leave these commented out for now until we build the database!
# def test_unauthorized_move():
#     response = client.post("/api/move?x=10&y=10")
#     assert response.status_code == 401
