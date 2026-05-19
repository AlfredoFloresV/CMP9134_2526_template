import pytest
from main import is_safe_move  # Imports the clean math function from your main file

# A simple 3x3 mock map to test the logic (1 = obstacle, 0 = empty space)
MOCK_GRID = [
    [0, 1, 0],  # Top Row    (Y=2)
    [0, 0, 0],  # Middle Row (Y=1)
    [1, 0, 0]   # Bottom Row (Y=0)
]

def test_coordinate_and_obstacle_math():
    # Test 1: Out of bounds completely should fail
    assert is_safe_move(-1, 5, MOCK_GRID) is False
    assert is_safe_move(5, 21, MOCK_GRID) is False

    # Test 2: Bottom-left corner (0,0) has an obstacle in our mock grid, should fail
    assert is_safe_move(0, 0, MOCK_GRID) is False

    # Test 3: Top-middle (1,2) has an obstacle, should fail
    assert is_safe_move(1, 2, MOCK_GRID) is False

    # Test 4: Center cell (1,1) is empty, should pass
    assert is_safe_move(1, 1, MOCK_GRID) is True