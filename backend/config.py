import os

DATA_DIR = os.environ.get('HEALTH_DASH_DATA_DIR', 'data')
WEIGHT_FILE = os.path.join(DATA_DIR, 'weight_data.json')
WORKOUT_FILE = os.path.join(DATA_DIR, 'workout_data.json')
MEAL_FILE = os.path.join(DATA_DIR, 'meal_data.json')
JOURNAL_DIR = os.path.join(DATA_DIR, 'journal')

VALID_WORKOUT_TYPES = ['Running', 'Weights', 'Swim', 'Yoga']
