"""Tests for mcp_tools.py — API wrapper, error handling, tool entry points."""

import json
import pytest
from unittest.mock import patch, MagicMock
from urllib.error import HTTPError, URLError

from mcp_tools import (
    _api_get,
    search_recipes,
    recommend_recipes,
    get_recipe,
    get_categories,
    check_api_health,
    tool_search,
    tool_recipe,
    tool_categories,
    tool_recommend,
    ApiError,
)


# ── _api_get ────────────────────────────────────────────────────────


class TestApiGet:
    @patch("mcp_tools.urllib.request.urlopen")
    def test_success_json(self, mock_urlopen):
        resp = MagicMock()
        resp.read.return_value = json.dumps({"ok": True}).encode("utf-8")
        resp.__enter__ = lambda s: s
        resp.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = resp

        result = _api_get("/health")
        assert result == {"ok": True}

    @patch("mcp_tools.urllib.request.urlopen")
    def test_http_error_raises(self, mock_urlopen):
        mock_urlopen.side_effect = HTTPError(
            url="https://api.howtocook.cn/search",
            code=429,
            msg="Too Many Requests",
            hdrs=None,
            fp=None,
        )
        with pytest.raises(ApiError, match="HTTP 429"):
            _api_get("/search")

    @patch("mcp_tools.urllib.request.urlopen")
    def test_network_error_raises(self, mock_urlopen):
        mock_urlopen.side_effect = URLError("Connection refused")
        with pytest.raises(ApiError, match="网络错误"):
            _api_get("/search")

    @patch("mcp_tools.urllib.request.urlopen")
    def test_invalid_json_raises(self, mock_urlopen):
        resp = MagicMock()
        resp.read.return_value = b"not json"
        resp.__enter__ = lambda s: s
        resp.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = resp

        with pytest.raises(ApiError, match="JSON 解析错误"):
            _api_get("/search")

    @patch("mcp_tools.urllib.request.urlopen")
    def test_params_in_url(self, mock_urlopen):
        resp = MagicMock()
        resp.read.return_value = b'{"results":[]}'
        resp.__enter__ = lambda s: s
        resp.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = resp

        _api_get("/search", {"q": "红烧肉", "limit": "5"})
        call_args = mock_urlopen.call_args
        url = call_args[0][0].full_url
        # Query params must be URL-encoded (M-3): 中文 -> 百分号编码
        assert "q=%E7%BA%A2%E7%83%A7%E8%82%89" in url
        assert "limit=5" in url


# ── search_recipes ──────────────────────────────────────────────────


class TestSearchRecipes:
    @patch("mcp_tools._api_get")
    def test_returns_results(self, mock_get):
        mock_get.return_value = {"results": [{"name": "红烧肉"}], "total": 1, "query": {}}
        result = search_recipes(q="红烧肉")
        assert result["total"] == 1
        mock_get.assert_called_once_with("/search", {"q": "红烧肉"})

    @patch("mcp_tools._api_get")
    def test_all_filters(self, mock_get):
        mock_get.return_value = {"results": [], "total": 0, "query": {}}
        search_recipes(q="x", category="soup", cuisine="川菜", cooking_method="炒", cook_time="quick", limit=5)
        mock_get.assert_called_once_with("/search", {
            "q": "x", "category": "soup", "cuisine": "川菜",
            "cooking_method": "炒", "cook_time": "quick", "limit": "5",
        })

    @patch("mcp_tools._api_get")
    def test_api_error_propagates(self, mock_get):
        mock_get.side_effect = ApiError("fail")
        with pytest.raises(ApiError):
            search_recipes(q="x")


# ── recommend_recipes ───────────────────────────────────────────────


class TestRecommendRecipes:
    @patch("mcp_tools._api_get")
    def test_returns_results(self, mock_get):
        mock_get.return_value = {"results": [{"name": "红烧肉"}], "total": 1, "query": {}}
        result = recommend_recipes(source="howtocook")
        assert result["total"] == 1
        mock_get.assert_called_once_with("/recommend", {"source": "howtocook"})

    @patch("mcp_tools._api_get")
    def test_difficulty_max_serialized_as_str(self, mock_get):
        mock_get.return_value = {"results": [], "total": 0, "query": {}}
        recommend_recipes(difficulty_max=2)
        mock_get.assert_called_once_with("/recommend", {"difficulty_max": "2"})

    @patch("mcp_tools._api_get")
    def test_all_filters(self, mock_get):
        mock_get.return_value = {"results": [], "total": 0, "query": {}}
        recommend_recipes(
            source="howtocook", category="meat_dish", cuisine="川菜",
            cooking_method="炒", cook_time="quick", difficulty_max=3,
            language="zh", limit=50,
        )
        mock_get.assert_called_once_with("/recommend", {
            "source": "howtocook", "category": "meat_dish", "cuisine": "川菜",
            "cooking_method": "炒", "cook_time": "quick", "difficulty_max": "3",
            "language": "zh", "limit": "50",
        })

    @patch("mcp_tools._api_get")
    def test_default_limit_not_sent(self, mock_get):
        mock_get.return_value = {"results": [], "total": 0, "query": {}}
        recommend_recipes()
        mock_get.assert_called_once_with("/recommend", {})


class TestToolRecommend:
    def test_returns_json_string(self):
        with patch("mcp_tools.recommend_recipes") as mock_rec:
            mock_rec.return_value = {"results": [{"name": "红烧肉"}], "total": 1}
            out = tool_recommend(source="howtocook")
            assert isinstance(out, str)
            assert json.loads(out)["total"] == 1

    def test_error_returns_error_json(self):
        with patch("mcp_tools.recommend_recipes", side_effect=ApiError("fail")):
            out = tool_recommend()
            assert json.loads(out)["error"] == "fail"


# ── get_recipe ──────────────────────────────────────────────────────


class TestGetRecipe:
    @patch("mcp_tools._api_get")
    def test_returns_recipe(self, mock_get):
        mock_get.return_value = {"name": "红烧肉", "id": "howtocook/红烧肉"}
        result = get_recipe("howtocook/红烧肉")
        assert result["name"] == "红烧肉"

    def test_empty_id_raises(self):
        with pytest.raises(ApiError, match="不能为空"):
            get_recipe("")

    @patch("mcp_tools._api_get")
    def test_not_found(self, mock_get):
        mock_get.side_effect = ApiError("HTTP 404")
        with pytest.raises(ApiError):
            get_recipe("nonexistent")


# ── get_categories ──────────────────────────────────────────────────


class TestGetCategories:
    @patch("mcp_tools._api_get")
    def test_returns_categories(self, mock_get):
        mock_get.return_value = {"categories": [{"name": "meat_dish", "count": 100}]}
        result = get_categories()
        assert len(result["categories"]) == 1


# ── check_api_health ────────────────────────────────────────────────


class TestCheckApiHealth:
    @patch("mcp_tools._api_get")
    def test_healthy(self, mock_get):
        mock_get.return_value = {"status": "ok"}
        assert check_api_health() is True

    @patch("mcp_tools._api_get")
    def test_unhealthy(self, mock_get):
        mock_get.side_effect = ApiError("fail")
        assert check_api_health() is False


# ── Tool entry points (JSON string responses) ──────────────────────


class TestToolEntryPoints:
    @patch("mcp_tools.search_recipes")
    def test_tool_search_success(self, mock_search):
        mock_search.return_value = {"results": [{"name": "红烧肉"}], "total": 1, "query": {}}
        result = tool_search("红烧肉")
        parsed = json.loads(result)
        assert parsed["total"] == 1

    @patch("mcp_tools.search_recipes")
    def test_tool_search_error(self, mock_search):
        mock_search.side_effect = ApiError("network down")
        result = tool_search("x")
        parsed = json.loads(result)
        assert "error" in parsed

    @patch("mcp_tools.get_recipe")
    def test_tool_recipe_success(self, mock_get):
        mock_get.return_value = {"name": "红烧肉"}
        result = tool_recipe("howtocook/红烧肉")
        assert "红烧肉" in result

    @patch("mcp_tools.get_categories")
    def test_tool_categories_success(self, mock_get):
        mock_get.return_value = {"categories": []}
        result = tool_categories()
        assert "categories" in result


# ── Integration: search.py API-first fallback ──────────────────────


class TestSearchAPIFallback:
    """Test that search_dishes tries API first, falls back to local."""

    @patch("search._search_via_api")
    @patch("search.load_profile", return_value=None)
    @patch("search._ensure_synced")
    def test_uses_api_when_available(self, mock_sync, mock_profile, mock_api):
        from search import search_dishes
        mock_api.return_value = [{"name": "红烧肉", "id": "howtocook/红烧肉"}]
        results = search_dishes("红烧肉", {"dishes": []}, use_profile=False)
        assert len(results) == 1
        assert results[0]["name"] == "红烧肉"
        mock_api.assert_called_once()

    @patch("search._search_via_api")
    @patch("search.load_profile", return_value=None)
    @patch("search._ensure_synced")
    def test_falls_back_to_local(self, mock_sync, mock_profile, mock_api):
        from search import search_dishes
        mock_api.return_value = None
        index = {
            "dishes": [
                {"name": "红烧肉", "difficulty": 3, "category": "meat_dish",
                 "source": "howtocook", "cuisine": "家常", "cooking_method": "炖煮",
                 "cook_time": "medium", "ingredients": ["五花肉"],
                 "tags": {"spicy": False, "allergens": [], "diet": []}},
            ]
        }
        results = search_dishes("红烧肉", index, use_profile=False)
        assert len(results) == 1
        mock_api.assert_called_once()


# ── Local index cache ──────────────────────────────────────────────


class TestLocalIndexCache:
    def test_cache_hit(self, tmp_path):
        from search import _load_local_index_cached
        idx = tmp_path / "index.json"
        idx.write_text('{"dishes": [{"name": "test"}]}', encoding="utf-8")

        # First load
        result1 = _load_local_index_cached(str(idx))
        # Second load (should use cache)
        result2 = _load_local_index_cached(str(idx))
        assert result1 == result2
        assert len(result1["dishes"]) == 1

    def test_cache_miss_on_mtime_change(self, tmp_path):
        from search import _load_local_index_cached
        import search as search_mod

        idx = tmp_path / "index.json"
        idx.write_text('{"dishes": [{"name": "v1"}]}', encoding="utf-8")
        result1 = _load_local_index_cached(str(idx))

        # Force cache clear by changing mtime
        search_mod._local_index_cache = None
        idx.write_text('{"dishes": [{"name": "v2"}]}', encoding="utf-8")
        result2 = _load_local_index_cached(str(idx))
        assert result2["dishes"][0]["name"] == "v2"
