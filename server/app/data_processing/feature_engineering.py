from datetime import datetime
from .data_loader import load_historical_data
import pandas as pd

def calculate_indicators(data):
    """
    Funkcja oblicza wskaźniki `ma20`, `ma100`, `ma150`, i `roc` na podstawie danych.
    """
    data['ma20'] = data['close'].rolling(window=20).mean()
    data['ma100'] = data['close'].rolling(window=100).mean()
    data['ma150'] = data['close'].rolling(window=150).mean()
    data['roc'] = data['close'].pct_change(periods=5)  # Zmiana procentowa z 5 dni
    return data

def prepare_date_features(prediction_date_str, historical_data_path, start_date=None):
    """
    Przygotowuje cechy wejściowe dla modelu.
    """
    # Konwersja dat
    prediction_date = datetime.strptime(prediction_date_str, '%Y-%m-%d')
    if start_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d')
    
    # Ustal liczbę wymaganych dni dla wskaźników
    required_days = 150  # Największa wartość okresu do obliczenia wskaźników
    
    # Załaduj dane historyczne, uwzględniając `required_days`
    data = load_historical_data(historical_data_path, start_date, required_days=required_days)
    
    # Oblicz wskaźniki
    data = calculate_indicators(data)
    
    # Pobierz ostatni wiersz przed `prediction_date`
    last_row = data.iloc[-1]
    
    # Przygotuj cechy wejściowe do modelu
    features = [
        last_row['high'], last_row['low'], last_row['volume'],
        last_row['ma20'], last_row['ma100'], last_row['ma150'], last_row['roc']
    ]
    
    return features
