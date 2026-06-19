"""Pytest configuration — make build-only modules under scripts/ importable.

``scripts/indexer.py`` is a build-time tool physically isolated from the
runtime package. Its tests (``tests/test_indexer.py``) still do
``from indexer import ...``, so we put ``scripts/`` on ``sys.path`` here.
The indexer module itself re-adds the repo root for its own ``schema`` /
``utils`` imports.
"""

import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parent.parent
_SCRIPTS = _REPO_ROOT / "scripts"
if str(_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS))
