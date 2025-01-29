import os

class Config:
    # Konfiguracja MongoDB
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/wallet')  # Możliwość ustawienia przez zmienne środowiskowe

    # Ścieżki do modeli i danych
    MODEL_PATH = os.getenv('MODEL_PATH', r'C:\Users\Kuba\Desktop\STUDIA\mgr\ai\xgboost\gotowe modele\LSTM\lstm_model_scripted.pt')
    SCALER_PATH = os.getenv('SCALER_PATH', r'C:\Users\Kuba\Desktop\STUDIA\mgr\ai\xgboost\gotowe modele\LSTM\scaler.pkl')
    HISTORICAL_DATA_PATH = os.getenv('HISTORICAL_DATA_PATH', r'C:\Users\Kuba\Desktop\STUDIA\mgr\ai\xgboost\EURUSD_with_features.csv')
    
    # Inne ustawienia
    SEQUENCE_LENGTH = int(os.getenv('SEQUENCE_LENGTH', 10))  # Liczba dni w sekwencji do prognozy
