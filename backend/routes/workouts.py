from flask import Blueprint, jsonify

from backend.config import VALID_WORKOUT_TYPES
from backend.http import InvalidJsonRequestError, require_json_object
from backend.services.data_service import append_workout_entry, read_workout_data

workouts_bp = Blueprint('workouts', __name__)


@workouts_bp.route('/api/workouts', methods=['GET'])
def get_workouts():
    data = read_workout_data()
    return jsonify(data)


@workouts_bp.route('/api/workouts', methods=['POST'])
def add_workout():
    try:
        payload = require_json_object()
        workout_type = payload.get('workout_type')
        note = payload.get('note', '')

        if not workout_type:
            return jsonify({'error': 'Workout type is required'}), 400

        if workout_type not in VALID_WORKOUT_TYPES:
            return jsonify({
                'error': f'Invalid workout type. Must be one of: {", ".join(VALID_WORKOUT_TYPES)}'
            }), 400

        if note is not None and not isinstance(note, str):
            return jsonify({'error': 'Note must be a string'}), 400

        if note:
            note = note.strip()
            if len(note) > 500:
                return jsonify({'error': 'Note too long (max 500 characters)'}), 400
        else:
            note = ''

        entry = append_workout_entry(workout_type, note)
        return jsonify(entry), 201
    except InvalidJsonRequestError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500
