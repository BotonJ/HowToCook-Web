import pytest
from sync import _validate_dish, _merge


class TestValidateDish:
    def test_valid_dish(self):
        dish = {"name": "红烧肉", "category": "meat_dish", "source": "howtocook", "difficulty": 3}
        assert _validate_dish(dish) is True

    def test_missing_name(self):
        dish = {"category": "meat_dish", "source": "howtocook", "difficulty": 3}
        assert _validate_dish(dish) is False

    def test_empty_name(self):
        dish = {"name": "", "category": "meat_dish", "source": "howtocook", "difficulty": 3}
        assert _validate_dish(dish) is False

    def test_not_dict(self):
        assert _validate_dish("not a dict") is False
        assert _validate_dish(None) is False
        assert _validate_dish(42) is False

    def test_path_traversal_blocked(self):
        dish = {"name": "bad", "category": "x", "source": "x", "difficulty": 1, "path": "../../../etc/passwd"}
        assert _validate_dish(dish) is False

    def test_absolute_path_blocked(self):
        dish = {"name": "bad", "category": "x", "source": "x", "difficulty": 1, "path": "/etc/passwd"}
        assert _validate_dish(dish) is False

    def test_safe_relative_path_ok(self):
        dish = {"name": "ok", "category": "x", "source": "x", "difficulty": 1, "path": "dishes/howtocook/红烧肉.md"}
        assert _validate_dish(dish) is True

    def test_empty_path_ok(self):
        dish = {"name": "ok", "category": "x", "source": "x", "difficulty": 1, "path": ""}
        assert _validate_dish(dish) is True


class TestMerge:
    def _make_local(self, dishes):
        return {"version": "2.0", "total": len(dishes), "sources": ["howtocook"], "dishes": dishes}

    def test_add_new_dishes(self):
        local = self._make_local([])
        remote = [{"name": "红烧肉", "category": "meat_dish", "source": "howtocook", "difficulty": 3}]
        result, added, updated, unchanged, local_only = _merge(local, remote)
        assert added == 1
        assert updated == 0
        assert result["total"] == 1

    def test_update_existing(self):
        local_dishes = [{"name": "红烧肉", "category": "meat_dish", "source": "howtocook", "difficulty": 3, "path": "old.md", "has_duplicate": False}]
        local = self._make_local(local_dishes)
        remote = [{"name": "红烧肉", "category": "meat_dish", "source": "howtocook", "difficulty": 4}]
        result, added, updated, unchanged, local_only = _merge(local, remote)
        assert added == 0
        assert updated == 1
        # path should be preserved from local
        assert result["dishes"][0]["path"] == "old.md"

    def test_keep_local_only(self):
        local_dishes = [{"name": "本地菜", "category": "other", "source": "随便做", "difficulty": 2, "path": "x.md", "has_duplicate": False}]
        local = self._make_local(local_dishes)
        remote = []
        result, added, updated, unchanged, local_only = _merge(local, remote)
        assert local_only == 1
        assert result["total"] == 1

    def test_mixed_operations(self):
        local_dishes = [
            {"name": "红烧肉", "category": "meat_dish", "source": "howtocook", "difficulty": 3, "path": "a.md", "has_duplicate": False},
            {"name": "本地菜", "category": "other", "source": "随便做", "difficulty": 2, "path": "b.md", "has_duplicate": False},
        ]
        local = self._make_local(local_dishes)
        remote = [
            {"name": "红烧肉", "category": "meat_dish", "source": "howtocook", "difficulty": 4},
            {"name": "新菜", "category": "soup", "source": "howtocook", "difficulty": 1},
        ]
        result, added, updated, unchanged, local_only = _merge(local, remote)
        assert added == 1
        assert updated == 1
        assert local_only == 1
        assert result["total"] == 3

    def test_duplicates_across_sources_preserved(self):
        # Same dish name from different sources must not collapse during sync.
        local_dishes = [
            {"id": "howtocook/宫保鸡丁", "name": "宫保鸡丁", "category": "meat_dish", "source": "howtocook", "difficulty": 3, "path": "a.md", "has_duplicate": True},
            {"id": "随便做/宫保鸡丁", "name": "宫保鸡丁", "category": "meat_dish", "source": "随便做", "difficulty": 3, "path": "b.md", "has_duplicate": True},
        ]
        local = self._make_local(local_dishes)
        remote = [
            {"id": "howtocook/宫保鸡丁", "name": "宫保鸡丁", "category": "meat_dish", "source": "howtocook", "difficulty": 4},
        ]
        result, added, updated, unchanged, local_only = _merge(local, remote)
        assert updated == 1
        assert local_only == 1  # 随便做 version kept
        assert result["total"] == 2
        assert any(d.get("source") == "随便做" for d in result["dishes"])
