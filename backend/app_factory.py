from flask import Flask

from backend.routes.health import health_bp
from backend.routes.journal import journal_bp
from backend.routes.meals import meals_bp
from backend.routes.pages import pages_bp
from backend.routes.weights import weights_bp
from backend.routes.workouts import workouts_bp


def create_app() -> Flask:
    app = Flask(__name__, template_folder='../templates', static_folder='../static')
    app.register_blueprint(pages_bp)
    app.register_blueprint(health_bp)
    app.register_blueprint(weights_bp)
    app.register_blueprint(workouts_bp)
    app.register_blueprint(journal_bp)
    app.register_blueprint(meals_bp)
    return app
