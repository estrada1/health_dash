from flask import Blueprint, jsonify

from backend.http import InvalidJsonRequestError, require_json_object
from backend.services.data_service import append_weight_entry, read_weight_data

weights_bp = Blueprint('weights', __name__)


@weights_bp.route('/api/weights', methods=['GET'])
def get_weights():
    data = read_weight_data()
    return jsonify(data)


@weights_bp.route('/api/weights', methods=['POST'])
def add_weight():
    try:
        payload = require_json_object()
        weight = payload.get('weight')

        if weight is None:
            return jsonify({'error': 'Weight is required'}), 400

        weight = float(weight)
        if weight <= 0:
            return jsonify({'error': 'Weight must be positive'}), 400

        entry = append_weight_entry(weight)
        return jsonify(entry), 201
    except InvalidJsonRequestError as e:
        return jsonify({'error': str(e)}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid weight value'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500
