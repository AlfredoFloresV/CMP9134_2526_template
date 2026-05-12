# The logic (usually imported from your main code)
def is_valid_target(x, y):
    if x < 0 or x > 100 or y < 0 or y > 100:
        return False
    return True


# The test
def test_valid_coordinates():
    # Arrange (Setup inputs)
    good_x, good_y = 50, 50
    bad_x, bad_y = 150, -10
    # Act (Run the function)
    result_good = is_valid_target(good_x, good_y)
    result_bad = is_valid_target(bad_x, bad_y)
    # Assert (Check the outcomes)
    assert result_good is True
    assert not result_bad
