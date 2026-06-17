"""Regression tests for website/skill/search.py — H-2 (API fallback semantics)
and H-3 (auto-sync env gate). Mirrors howtocook-skill/tests/test_search.py."""

import json
import pytest
from unittest.mock import patch

from search import _search_via_api, _ensure_synced


# ── _search_via_api failure semantics (H-2) ───────────────────────────


class TestSearchViaApiFallback:
    """An API error or malformed response must surface as None so the caller
    falls back to the local index — NOT as a successful empty list."""

    @patch("mcp_tools.search_recipes", return_value={"error": "HTTP 500"})
    def test_api_error_returns_none(self, _mock):
        assert _search_via_api("红烧肉") is None

    @patch("mcp_tools.search_recipes", return_value={"results": "not a list"})
    def test_malformed_results_returns_none(self, _mock):
        assert _search_via_api("红烧肉") is None

    @patch("mcp_tools.search_recipes", return_value={"total": 0})
    def test_missing_results_key_returns_none(self, _mock):
        assert _search_via_api("红烧肉") is None

    @patch("mcp_tools.search_recipes", return_value={"results": [], "total": 0})
    def test_genuine_empty_results_returns_empty_list(self, _mock):
        assert _search_via_api("不存在的菜") == []

    @patch("mcp_tools.search_recipes", return_value={"results": [{"name": "红烧肉"}], "total": 1})
    def test_valid_results_returned(self, _mock):
        assert _search_via_api("红烧肉") == [{"name": "红烧肉"}]

    @patch("mcp_tools.search_recipes", side_effect=Exception("network down"))
    def test_exception_returns_none(self, _mock):
        assert _search_via_api("红烧肉") is None


# ── _ensure_synced env gate (H-3) ─────────────────────────────────────


class TestEnsureSyncedEnvGate:
    @patch.dict("os.environ", {"HOWTOCOOK_AUTO_SYNC": "0"})
    @patch("sync.auto_sync_if_needed")
    @patch("update.auto_update_if_needed")
    def test_env_flag_disables_sync(self, mock_update, mock_sync):
        """HOWTOCOOK_AUTO_SYNC=0 must suppress implicit network sync (H-3)."""
        import search
        search._synced = False
        _ensure_synced()
        mock_sync.assert_not_called()
        mock_update.assert_not_called()
