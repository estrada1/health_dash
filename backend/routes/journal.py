from flask import Blueprint, jsonify

from backend.http import InvalidJsonRequestError, require_json_object
from backend.services.journal_service import (
    is_valid_journal_filename,
    list_journal_entries,
    markdown_to_html,
    parse_timestamp_from_filename,
    read_journal_entry,
    update_journal_entry,
    write_journal_entry,
)

journal_bp = Blueprint('journal', __name__)


@journal_bp.route('/api/journal', methods=['GET'])
def get_journal_entries():
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


@journal_bp.route('/api/journal', methods=['POST'])
def add_journal_entry():
    try:
        payload = require_json_object()
        content = payload.get('content')

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
    except InvalidJsonRequestError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@journal_bp.route('/api/journal/<filename>', methods=['GET'])
def get_journal_entry(filename):
    try:
        if not is_valid_journal_filename(filename):
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


@journal_bp.route('/api/journal/<filename>', methods=['PUT'])
def update_journal_entry_route(filename):
    try:
        if not is_valid_journal_filename(filename):
            return jsonify({'error': 'Invalid filename'}), 400

        payload = require_json_object()
        content = payload.get('content')

        if not content or not isinstance(content, str):
            return jsonify({'error': 'Content is required'}), 400

        content = content.strip()
        if not content:
            return jsonify({'error': 'Content cannot be empty'}), 400

        if len(content) > 10000:
            return jsonify({'error': 'Content too long (max 10,000 characters)'}), 400

        updated = update_journal_entry(filename, content)
        if not updated:
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
    except InvalidJsonRequestError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500
