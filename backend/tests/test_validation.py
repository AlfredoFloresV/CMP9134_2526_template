from main import is_safe_move  # Imports the math function from main file

# A simple 3x3 mock map to test the logic (1 = obstacle, 0 = empty space)
MOCK_GRID = [
    [0, 1, 0],  # Top Row    (Y=2)
    [0, 0, 0],  # Middle Row (Y=1)
    [1, 0, 0],  # Bottom Row (Y=0)
]


def test_coordinate_and_obstacle_math():
    # Test 1: Out of bounds completely should fail
    assert is_safe_move(-1, 5, MOCK_GRID) is False
    assert is_safe_move(5, 21, MOCK_GRID) is False

    # Test 2: Bottom-left corner (0,0) has an obstacle, should fail
    assert is_safe_move(0, 0, MOCK_GRID) is False

    # Test 3: Top-middle (1,2) has an obstacle, should fail
    assert is_safe_move(1, 2, MOCK_GRID) is False

    # Test 4: Center cell (1,1) is empty, should pass
    assert is_safe_move(1, 1, MOCK_GRID) is True


def test_grid_extreme_boundaries():
    # Test 5: Verify upper limit boundary constraints (20, 20) are processed
    large_mock_grid = [[0] * 21 for _ in range(21)]

    assert is_safe_move(20, 20, large_mock_grid) is True
    assert is_safe_move(21, 20, large_mock_grid) is False
    assert is_safe_move(20, 21, large_mock_grid) is False
