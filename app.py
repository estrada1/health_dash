from flask import Flask, render_template, request, jsonify
from datetime import datetime
import json
import os

app = Flask(__name__)
DATA_FILE = 'data/weight_data.json'


def ensure_data_directory():
    """Create data directory if it doesn't exist"""
    os.makedirs('data', exist_ok=True)


def read_weight_data():
    """Read weight data from JSON file"""
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return []


def write_weight_data(data):
    """Write weight data to JSON file"""
    ensure_data_directory()
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)


@app.route('/')
def index():
    """Serve the main HTML page"""
    return render_template('index.html')


@app.route('/api/weights', methods=['GET'])
def get_weights():
    """Return all weight entries"""
    data = read_weight_data()
    return jsonify(data)


@app.route('/api/weights', methods=['POST'])
def add_weight():
    """Add a new weight entry"""
    try:
        # Get weight from request
        weight = request.json.get('weight')

        # Validate weight
        if weight is None:
            return jsonify({'error': 'Weight is required'}), 400

        weight = float(weight)
        if weight <= 0:
            return jsonify({'error': 'Weight must be positive'}), 400

        # Create new entry with timestamp
        entry = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'weight': weight
        }

        # Read existing data, append new entry, and save
        data = read_weight_data()
        data.append(entry)
        write_weight_data(data)

        return jsonify(entry), 201

    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid weight value'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
