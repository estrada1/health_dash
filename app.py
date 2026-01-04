from flask import Flask, render_template, request, jsonify
from datetime import datetime
import json
import os
import re
import markdown
import bleach

app = Flask(__name__)
DATA_DIR = os.environ.get('HEALTH_DASH_DATA_DIR', 'data')
DATA_FILE = os.path.join(DATA_DIR, 'weight_data.json')
JOURNAL_DIR = os.path.join(DATA_DIR, 'journal')
WORKOUT_FILE = os.path.join(DATA_DIR, 'workout_data.json')
MEAL_FILE = os.path.join(DATA_DIR, 'meal_data.json')
VALID_WORKOUT_TYPES = ['Running', 'Weights', 'Swim', 'Yoga']


def ensure_data_directory():
    """Create data directory if it doesn't exist"""
    os.makedirs(DATA_DIR, exist_ok=True)


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


def read_workout_data():
    """Read workout data from JSON file"""
    if not os.path.exists(WORKOUT_FILE):
        return []
    try:
        with open(WORKOUT_FILE, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return []


def write_workout_data(data):
    """Write workout data to JSON file"""
    ensure_data_directory()
    with open(WORKOUT_FILE, 'w') as f:
        json.dump(data, f, indent=2)


def read_meal_data():
    """Read meal data from JSON file"""
    if not os.path.exists(MEAL_FILE):
        return []
    try:
        with open(MEAL_FILE, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return []


def write_meal_data(data):
    """Write meal data to JSON file"""
    ensure_data_directory()
    with open(MEAL_FILE, 'w') as f:
        json.dump(data, f, indent=2)


def ensure_journal_directory():
    """Create journal directory if it doesn't exist"""
    os.makedirs(JOURNAL_DIR, exist_ok=True)


def create_journal_filename():
    """Generate unique filename based on timestamp"""
    now = datetime.utcnow()
    filename = now.strftime('%Y-%m-%d-%H%M%S') + f'-{now.microsecond}.md'
    return filename


def write_journal_entry(content):
    """Write a new journal entry to a markdown file"""
    ensure_journal_directory()
    filename = create_journal_filename()
    filepath = os.path.join(JOURNAL_DIR, filename)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    return filename


def read_journal_entry(filename):
    """Read a specific journal entry"""
    filepath = os.path.join(JOURNAL_DIR, filename)
    if not os.path.exists(filepath):
        return None

    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()


def list_journal_entries():
    """List all journal entries sorted by timestamp (newest first)"""
    ensure_journal_directory()

    if not os.path.exists(JOURNAL_DIR):
        return []

    files = [f for f in os.listdir(JOURNAL_DIR) if f.endswith('.md')]
    files.sort(reverse=True)

    return files


def parse_timestamp_from_filename(filename):
    """Extract timestamp from filename"""
    match = re.match(r'(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})(\d{2})-(\d+)\.md', filename)
    if not match:
        return None

    year, month, day, hour, minute, second, microsecond = match.groups()
    dt = datetime(int(year), int(month), int(day), int(hour), int(minute), int(second), int(microsecond))
    return dt.isoformat() + 'Z'


def markdown_to_html(markdown_text):
    """Convert markdown to sanitized HTML"""
    html = markdown.markdown(
        markdown_text,
        extensions=['fenced_code', 'tables', 'nl2br']
    )

    allowed_tags = [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'blockquote', 'code', 'pre', 'hr', 'ul', 'ol', 'li', 'a', 'table',
        'thead', 'tbody', 'tr', 'th', 'td'
    ]
    allowed_attrs = {
        'a': ['href', 'title'],
        'code': ['class']
    }

    clean_html = bleach.clean(html, tags=allowed_tags, attributes=allowed_attrs)
    return clean_html


@app.route('/')
def index():
    """Serve the main HTML page"""
    return render_template('index.html')


@app.route('/journal')
def journal():
    """Serve the journal HTML page"""
    return render_template('journal.html')


@app.route('/diet')
def diet():
    """Serve the diet HTML page"""
    return render_template('diet.html')


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


@app.route('/api/journal', methods=['GET'])
def get_journal_entries():
    """Return list of all journal entries with metadata"""
    try:
        files = list_journal_entries()

        entries = []
        for filename in files[:10]:
            content = read_journal_entry(filename)
            if content is None:
                continue

            timestamp = parse_timestamp_from_filename(filename)
            html = markdown_to_html(content)

            entries.append({
                'filename': filename,
                'timestamp': timestamp,
                'html': html
            })

        return jsonify(entries)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/journal', methods=['POST'])
def add_journal_entry():
    """Add a new journal entry"""
    try:
        content = request.json.get('content')

        if not content or not isinstance(content, str):
            return jsonify({'error': 'Content is required'}), 400

        content = content.strip()
        if not content:
            return jsonify({'error': 'Content cannot be empty'}), 400

        if len(content) > 10000:
            return jsonify({'error': 'Content too long (max 10,000 characters)'}), 400

        filename = write_journal_entry(content)
        timestamp = parse_timestamp_from_filename(filename)
        html = markdown_to_html(content)

        entry = {
            'filename': filename,
            'timestamp': timestamp,
            'content': content,
            'html': html
        }

        return jsonify(entry), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/journal/<filename>', methods=['GET'])
def get_journal_entry(filename):
    """Get a specific journal entry"""
    try:
        if not re.match(r'^\d{4}-\d{2}-\d{2}-\d{6}-\d+\.md$', filename):
            return jsonify({'error': 'Invalid filename'}), 400

        content = read_journal_entry(filename)
        if content is None:
            return jsonify({'error': 'Entry not found'}), 404

        timestamp = parse_timestamp_from_filename(filename)
        html = markdown_to_html(content)

        entry = {
            'filename': filename,
            'timestamp': timestamp,
            'content': content,
            'html': html
        }

        return jsonify(entry)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/journal/<filename>', methods=['PUT'])
def update_journal_entry(filename):
    """Update a specific journal entry"""
    try:
        if not re.match(r'^\d{4}-\d{2}-\d{2}-\d{6}-\d+\.md$', filename):
            return jsonify({'error': 'Invalid filename'}), 400

        filepath = os.path.join(JOURNAL_DIR, filename)
        if not os.path.exists(filepath):
            return jsonify({'error': 'Entry not found'}), 404

        content = request.json.get('content')

        if not content or not isinstance(content, str):
            return jsonify({'error': 'Content is required'}), 400

        content = content.strip()
        if not content:
            return jsonify({'error': 'Content cannot be empty'}), 400

        if len(content) > 10000:
            return jsonify({'error': 'Content too long (max 10,000 characters)'}), 400

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        timestamp = parse_timestamp_from_filename(filename)
        html = markdown_to_html(content)

        entry = {
            'filename': filename,
            'timestamp': timestamp,
            'content': content,
            'html': html
        }

        return jsonify(entry)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/workouts', methods=['GET'])
def get_workouts():
    """Return all workout entries"""
    data = read_workout_data()
    return jsonify(data)


@app.route('/api/workouts', methods=['POST'])
def add_workout():
    """Add a new workout entry"""
    try:
        workout_type = request.json.get('workout_type')
        note = request.json.get('note', '')

        # Validate workout_type
        if not workout_type:
            return jsonify({'error': 'Workout type is required'}), 400

        if workout_type not in VALID_WORKOUT_TYPES:
            return jsonify({
                'error': f'Invalid workout type. Must be one of: {", ".join(VALID_WORKOUT_TYPES)}'
            }), 400

        # Validate note
        if note is not None and not isinstance(note, str):
            return jsonify({'error': 'Note must be a string'}), 400

        if note:
            note = note.strip()
            if len(note) > 500:
                return jsonify({'error': 'Note too long (max 500 characters)'}), 400

        # Create entry
        entry = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'workout_type': workout_type,
            'note': note
        }

        data = read_workout_data()
        data.append(entry)
        write_workout_data(data)

        return jsonify(entry), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/meals', methods=['GET'])
def get_meals():
    """Return all meal entries"""
    data = read_meal_data()
    return jsonify(data)


@app.route('/api/meals', methods=['POST'])
def add_meal():
    """Add a new meal entry"""
    try:
        title = request.json.get('title')
        calories = request.json.get('calories')
        notes = request.json.get('notes', '')

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

        entry = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'title': title,
            'calories': calories,
            'notes': notes
        }

        data = read_meal_data()
        data.append(entry)
        write_meal_data(data)

        return jsonify(entry), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
