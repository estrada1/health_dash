from flask import Blueprint, jsonify

from backend.http import InvalidJsonRequestError, require_json_object
from backend.services.data_service import append_meal_entry, read_meal_data

meals_bp = Blueprint('meals', __name__)


@meals_bp.route('/api/meals', methods=['GET'])
def get_meals():
    data = read_meal_data()
    return jsonify(data)


@meals_bp.route('/api/meals', methods=['POST'])
def add_meal():
    try:
        payload = require_json_object()
        title = payload.get('title')
        calories = payload.get('calories')
        notes = payload.get('notes', '')

        if not title or not isinstance(title, str):
            return jsonify({'error': 'Title is required'}), 400

        title = title.strip()
        if not title:
            return jsonify({'error': 'Title cannot be empty'}), 400

        if calories is not None and calories != '':
            try:
                calories = int(calories)
            except (ValueError, TypeError):
                return jsonify({'error': 'Calories must be a number'}), 400
            if calories < 0:
                return jsonify({'error': 'Calories must be zero or positive'}), 400
        else:
            calories = None

        if notes is not None and not isinstance(notes, str):
            return jsonify({'error': 'Notes must be a string'}), 400

        if notes:
            notes = notes.strip()
            if len(notes) > 2000:
                return jsonify({'error': 'Notes too long (max 2,000 characters)'}), 400
        else:
            notes = ''

        entry = append_meal_entry(title, calories, notes)
        return jsonify(entry), 201
    except InvalidJsonRequestError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500
