import pytest
import os

filepath = "/tmp/studio/output/test.txt"

def test_create_filepath():
    with open(filepath, "w") as f:
        f.write("abc")

    assert isinstance(filepath, str)
    assert os.path.exists(filepath)