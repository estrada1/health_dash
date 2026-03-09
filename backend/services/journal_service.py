from __future__ import annotations

from datetime import datetime
import os
import re

import bleach
import markdown

from backend.config import JOURNAL_DIR

_JOURNAL_FILENAME_RE = re.compile(r'^\d{4}-\d{2}-\d{2}-\d{6}-\d+\.md$')


def ensure_journal_directory() -> None:
    os.makedirs(JOURNAL_DIR, exist_ok=True)


def is_valid_journal_filename(filename: str) -> bool:
    return bool(_JOURNAL_FILENAME_RE.match(filename))


def create_journal_filename() -> str:
    now = datetime.utcnow()
    return now.strftime('%Y-%m-%d-%H%M%S') + f'-{now.microsecond}.md'


def write_journal_entry(content: str) -> str:
    ensure_journal_directory()
    filename = create_journal_filename()
    filepath = os.path.join(JOURNAL_DIR, filename)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    return filename


def update_journal_entry(filename: str, content: str) -> bool:
    if not is_valid_journal_filename(filename):
        return False

    filepath = os.path.join(JOURNAL_DIR, filename)
    if not os.path.exists(filepath):
        return False

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    return True


def read_journal_entry(filename: str) -> str | None:
    filepath = os.path.join(JOURNAL_DIR, filename)
    if not os.path.exists(filepath):
        return None

    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()


def list_journal_entries() -> list[str]:
    ensure_journal_directory()
    files = [f for f in os.listdir(JOURNAL_DIR) if f.endswith('.md')]
    files.sort(reverse=True)
    return files


def parse_timestamp_from_filename(filename: str) -> str | None:
    match = re.match(r'(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})(\d{2})-(\d+)\.md', filename)
    if not match:
        return None

    year, month, day, hour, minute, second, microsecond = match.groups()
    dt = datetime(int(year), int(month), int(day), int(hour), int(minute), int(second), int(microsecond))
    return dt.isoformat() + 'Z'


def markdown_to_html(markdown_text: str) -> str:
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

    return bleach.clean(html, tags=allowed_tags, attributes=allowed_attrs)
