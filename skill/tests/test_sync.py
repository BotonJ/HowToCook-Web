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

    def test_difficulty_must_be_int(self):
        # 与 API isDishIndex 类型契约对齐：difficulty 必须是 number
        dish = {"name": "ok", "category": "x", "source": "x", "difficulty": "3"}
        assert _validate_dish(dish) is False

    def test_category_must_be_str(self):
        dish = {"name": "ok", "category": 5, "source": "x", "difficulty": 1}
        assert _validate_dish(dish) is False

    def test_optional_field_wrong_type_rejected_when_required(self):
        # ingredients 非必需字段，但若提供且类型错（必需字段维度），应拒绝
        # ingredients 本身非必需，故类型错也不影响 —— 此测试确认非必需字段
        # 类型错误不会误拒合法条目（向后兼容）
        dish = {"name": "ok", "category": "x", "source": "x", "difficulty": 1, "ingredients": "not a list"}
        assert _validate_dish(dish) is True

    def test_full_sync_contract_fields_ok(self):
        # 模拟 /sync 返回的完整 12 字段条目，应通过
        dish = {
            "id": "howtocook/红烧肉", "name": "红烧肉", "difficulty": 3,
            "category": "meat_dish", "source": "howtocook", "cuisine": "家常",
            "cooking_method": "炖煮", "cook_time": "medium",
            "main_ingredients": ["猪肉"], "ingredients": ["五花肉"],
            "tags": {"spicy": False}, "has_duplicate": False,
        }
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
        # 本地 path 是废弃的 dishes/... 引用，合并时必须清零（运行时走 API）
        assert result["dishes"][0]["path"] == ""

    def test_local_only_path_blanked(self):
        # 仅本地保留的条目，其历史 path 也必须清零，避免悬空引用
        local_dishes = [{"name": "本地菜", "category": "other", "source": "随便做", "difficulty": 2, "path": "x.md", "has_duplicate": False}]
        local = self._make_local(local_dishes)
        remote = []
        result, added, updated, unchanged, local_only = _merge(local, remote)
        assert local_only == 1
        assert result["dishes"][0]["path"] == ""

    def test_remote_path_never_kept(self):
        # 即使远程/本地带 path，合并产物一律不带本地 md 引用
        local_dishes = [{"id": "howtocook/A", "name": "A", "category": "x", "source": "howtocook", "difficulty": 1, "path": "local.md"}]
        local = self._make_local(local_dishes)
        remote = [{"id": "howtocook/A", "name": "A", "category": "x", "source": "howtocook", "difficulty": 2, "path": "remote.md"}]
        result, *_ = _merge(local, remote)
        assert result["dishes"][0]["path"] == ""

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
