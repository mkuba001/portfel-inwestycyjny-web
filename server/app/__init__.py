from flask import Flask
from flask_cors import CORS
from flasgger import Swagger
from config import Config
from .db import initialize_db

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
swagger = Swagger(app)

# Inicjalizujemy bazę danych w kontekście aplikacji
with app.app_context():
    initialize_db()

# Importujemy endpointy
from .routes import prediction, db_test, investment_goal, wallet
