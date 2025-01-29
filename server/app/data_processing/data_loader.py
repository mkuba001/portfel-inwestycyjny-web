import pandas as pd
from app.config import Config

def load_historical_data(end_date):
    data = pd.read_csv(Config.HISTORICAL_DATA_PATH, parse_dates=['datetime'])
    initial_date = end_date - pd.Timedelta(days=Config.SEQUENCE_LENGTH)

    # Filtrowanie danych od `initial_date` do `end_date`
    data = data[(data['datetime'] >= initial_date) & (data['datetime'] < end_date)]
    data = data.sort_values(by='datetime')

    print(f"Załadowano dane historyczne od {initial_date} do {end_date}, długość przed uzupełnieniem: {len(data)}")

    # Uzupełnij brakujące dni, tworząc pełny zakres dat
    all_dates = pd.date_range(start=initial_date, end=end_date - pd.Timedelta(days=1))
    data = data.set_index('datetime').reindex(all_dates).interpolate(method='linear').reset_index()
    data.rename(columns={'index': 'datetime'}, inplace=True)

    # Sprawdź, czy nadal są NaN i wypełnij średnią kolumny
    data.fillna(data.mean(), inplace=True)
    
    print(f"Długość danych po uzupełnieniu: {len(data)}")
    print(data.isnull().sum())  # Powinno pokazać 0 we wszystkich kolumnach, jeśli NaN zostały wypełnione

    return data
