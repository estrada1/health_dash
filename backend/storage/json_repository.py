from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from typing import Any


class JsonRepository:
    def __init__(self, path: str | Path):
        self.path = Path(path)

    def read_all(self) -> list[dict[str, Any]]:
        if not self.path.exists():
            return []
        try:
            with self.path.open('r', encoding='utf-8') as f:
                data = json.load(f)
        except json.JSONDecodeError:
            return []

        if not isinstance(data, list):
            return []
        return data

    def append(self, item: dict[str, Any]) -> list[dict[str, Any]]:
        data = self.read_all()
        data.append(item)
        self.write_all(data)
        return data

    def write_all(self, data: list[dict[str, Any]]) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        fd, tmp_path = tempfile.mkstemp(dir=str(self.path.parent), prefix=f"{self.path.name}.", text=True)
        try:
            with os.fdopen(fd, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
                f.write('\n')
            os.replace(tmp_path, self.path)
        except Exception:
            try:
                os.remove(tmp_path)
            except FileNotFoundError:
                pass
            raise
