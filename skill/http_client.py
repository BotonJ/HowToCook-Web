#!/usr/bin/env python3
"""HowToCook 共享 HTTP 客户端 — 统一 API base URL 与 GET 请求实现。

mcp_tools.py（运行时工具）与 sync.py（数据同步）此前各持一份
``_api_get`` 与 ``API_BASE``，实现重复且易漂移。本模块是唯一事实源：

- ``API_BASE`` —— 远端 Worker 基址，全仓唯一一处定义。
- ``ApiError`` —— 网络层统一异常。
- ``api_get()`` —— 可配置 timeout / max_response_size / user_agent /
  query params 的 JSON GET。

调用方按需传参（sync 拉 /sync 全量需要更大上限与更长超时；
mcp_tools 单条查询用紧约束），异常类型差异由调用方自行捕获转换。
"""

import json
import logging
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

logger = logging.getLogger(__name__)

# 远端 HowToCook Worker 基址 —— 全仓唯一一处定义。
API_BASE = "https://api.howtocook.cn"

# 默认值：紧约束，适合单条查询。批量同步场景由调用方放大。
_DEFAULT_TIMEOUT = 15
_DEFAULT_MAX_RESPONSE_SIZE = 5 * 1024 * 1024  # 5 MB
_DEFAULT_USER_AGENT = "howtocook-client/1.0"


class ApiError(Exception):
    """Raised when a remote API call fails (network / HTTP / payload)."""


def api_get(
    path: str,
    *,
    params: dict[str, str] | None = None,
    timeout: int = _DEFAULT_TIMEOUT,
    max_response_size: int = _DEFAULT_MAX_RESPONSE_SIZE,
    user_agent: str = _DEFAULT_USER_AGENT,
) -> dict[str, Any]:
    """GET JSON from the HowToCook API. Raises ApiError on failure.

    ``path`` is appended to :data:`API_BASE` (path may start with ``/``).
    ``params`` becomes a URL-encoded query string (falsy values dropped).
    The response is capped at ``max_response_size`` bytes to bound memory.
    """
    url = f"{API_BASE}{path if path.startswith('/') else '/' + path}"
    if params:
        query = urllib.parse.urlencode({k: v for k, v in params.items() if v})
        if query:
            url = f"{url}?{query}"

    logger.debug("API request: %s", url)
    try:
        req = urllib.request.Request(
            url,
            headers={"Accept": "application/json", "User-Agent": user_agent},
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read(max_response_size + 1)
            if len(raw) > max_response_size:
                raise ApiError(f"响应过大: {url}")
            return json.loads(raw.decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise ApiError(f"HTTP {exc.code}: {url}") from exc
    except urllib.error.URLError as exc:
        raise ApiError(f"网络错误: {exc.reason}") from exc
    except json.JSONDecodeError as exc:
        raise ApiError(f"JSON 解析错误: {exc}") from exc
