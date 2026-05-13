from fastapi.testclient import TestClient
from main import app  # Import your actual app

client = TestClient(app)


# def test_unauthorized_move():
    # Attempting to move without a token
#    response = client.post("/api/move", json={"x": 10, "y": 10})
    # The API should block this and return a 401 Unauthorized status
#    assert response.status_code == 401
