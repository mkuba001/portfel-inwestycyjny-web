from pymongo import MongoClient
from config import Config
from datetime import datetime

client = MongoClient(Config.MONGO_URI)
db = client.get_database()

def initialize_db():
    try:
        # Sprawdzenie i inicjalizacja kolekcji 'predictions', jeśli jest pusta
        if db.predictions.count_documents({}) == 0:
            db.predictions.insert_one({
                'base_currency': "USD",
                'alternative_currency': "EUR",
                'start_time': datetime.strptime("2024-01-01", "%Y-%m-%d"),
                'end_time': datetime.strptime("2024-12-31", "%Y-%m-%d"),
                'created_at': datetime.now()
            })
            print("Initialized 'predictions' collection with a sample document.")
        else:
            print("'predictions' collection already initialized.")
        
        # Sprawdzenie i inicjalizacja kolekcji 'EURUSD', jeśli jest pusta
        if db.EURUSD.count_documents({}) == 0:
            db.EURUSD.insert_one({
                'symbol': "EURUSD",
                'price': 1.1,
                'timestamp': datetime.now()
            })
            print("Initialized 'EURUSD' collection with a sample document.")
        else:
            print("'EURUSD' collection already initialized.")

        # Wypisanie wszystkich kolekcji w bazie danych
        collections = db.list_collection_names()
        print("Collections in the database:")
        for collection in collections:
            print(f"- {collection}")

    except Exception as e:
        print(f"Error initializing database: {e}")

# Eksportowanie `db`, aby można było go używać w innych modułach
__all__ = ['db', 'initialize_db']
