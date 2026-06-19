import pytest
from pathlib import Path
from utils import skill_dir, skill_path, parse_difficulty


class TestSkillDir:
    def test_returns_parent_of_utils(self):
        d = skill_dir()
        assert d.is_dir()
        assert (d / "utils.py").exists()


class TestSkillPath:
    def test_relative_path(self):
        result = skill_path("index.json")
        assert result.name == "index.json"
        assert result.is_absolute()

    def test_absolute_path_within_base(self):
        base = skill_dir()
        result = skill_path(str(base / "index.json"))
        assert result.name == "index.json"

    def test_traversal_blocked(self):
        with pytest.raises(ValueError, match="escapes base directory"):
            skill_path("../../../etc/passwd")

    def test_traversal_blocked_absolute(self):
        with pytest.raises(ValueError, match="escapes base directory"):
            skill_path("/etc/passwd")

    def test_traversal_blocked_in_subdir(self):
        with pytest.raises(ValueError, match="escapes base directory"):
            skill_path("dishes/../../etc/passwd")


class TestParseDifficulty:
    def test_five_stars(self):
        assert parse_difficulty("★★★★★") == 5

    def test_one_star(self):
        assert parse_difficulty("★☆☆☆☆") == 1

    def test_no_stars_returns_default(self):
        assert parse_difficulty("no stars here") == 3

    def test_partial_stars(self):
        assert parse_difficulty("预估烹饪难度：★★★☆☆") == 3
