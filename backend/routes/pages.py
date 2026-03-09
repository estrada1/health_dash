from flask import Blueprint, render_template

pages_bp = Blueprint('pages', __name__)


@pages_bp.route('/')
def index():
    return render_template('index.html')


@pages_bp.route('/journal')
def journal():
    return render_template('journal.html')


@pages_bp.route('/diet')
def diet():
    return render_template('diet.html')
