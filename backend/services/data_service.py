from __future__ import annotations

from datetime import datetime
from typing import Any

from backend.config import MEAL_FILE, WEIGHT_FILE, WORKOUT_FILE
from backend.storage.json_repository import JsonRepository

_weight_repository = JsonRepository(WEIGHT_FILE)
_workout_repository = JsonRepository(WORKOUT_FILE)
_meal_repository = JsonRepository(MEAL_FILE)


def read_weight_data() -> list[dict[str, Any]]:
    return _weight_repository.read_all()


def append_weight_entry(weight: float) -> dict[str, Any]:
    entry = {
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'weight': weight
    }
    _weight_repository.append(entry)
    return entry


def read_workout_data() -> list[dict[str, Any]]:
    return _workout_repository.read_all()


def append_workout_entry(workout_type: str, note: str) -> dict[str, Any]:
    entry = {
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'workout_type': workout_type,
        'note': note
    }
    _workout_repository.append(entry)
    return entry


def read_meal_data() -> list[dict[str, Any]]:
    return _meal_repository.read_all()


def append_meal_entry(title: str, calories: int | None, notes: str) -> dict[str, Any]:
    entry = {
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'title': title,
        'calories': calories,
        'notes': notes
    }
    _meal_repository.append(entry)
    return entry
