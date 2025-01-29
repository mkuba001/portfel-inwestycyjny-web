import torch
import joblib
import pandas as pd
import json
import argparse
from datetime import timedelta
import torch.nn as nn

# Wybór urządzenia: GPU, jeśli dostępne, inaczej CPU
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class LSTMModel(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, output_size):
        super(LSTMModel, self).__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_size)
    
    def forward(self, x):
        h_0 = torch.zeros(self.lstm.num_layers, x.size(0), self.lstm.hidden_size).to(x.device)
        c_0 = torch.zeros(self.lstm.num_layers, x.size(0), self.lstm.hidden_size).to(x.device)
        
        out, _ = self.lstm(x, (h_0, c_0))
        out = self.fc(out[:, -1, :])
        return out

# Argumenty wiersza poleceń
parser = argparse.ArgumentParser()
parser.add_argument('--start_date', type=str, required=True, help='Data początkowa w formacie YYYY-MM-DD')
parser.add_argument('--prediction_date', type=str, required=True, help='Data końcowa w formacie YYYY-MM-DD')
args = parser.parse_args()

# Ścieżki do plików
model_path = r'C:\Users\Kuba\Desktop\STUDIA\mgr\ai\xgboost\gotowe modele\LSTM\lstm_model_complete.pth'
scaler_path = r'C:\Users\Kuba\Desktop\STUDIA\mgr\ai\xgboost\gotowe modele\LSTM\scaler.pkl'
data_path = r'C:\Users\Kuba\Desktop\STUDIA\mgr\ai\xgboost\EURUSD_with_features.csv'

# Załaduj model i przenieś go na odpowiednie urządzenie
model = torch.load(model_path, map_location=device)
model = model.to(device)
model.eval()

# Załaduj skalera
scaler = joblib.load(scaler_path)

# Wczytaj dane z CSV
data = pd.read_csv(data_path)
data['datetime'] = pd.to_datetime(data['datetime'])

# Ustaw daty początkową i końcową predykcji z argumentów
start_date = pd.Timestamp(args.start_date)
prediction_day = pd.Timestamp(args.prediction_date)

# Lista do przechowywania wyników prognozy
predictions = []

# Główna pętla predykcji
current_date = start_date
while current_date <= prediction_day:
    input_sequence = data[data['datetime'] < current_date].tail(10)

    if len(input_sequence) < 10:
        print(json.dumps({'error': f'Za mało danych do przewidywania na {current_date.date()}'}))
        exit(1)
    
    features = ['high', 'low', 'volume', 'ma20', 'ma100', 'ma150', 'roc']
    X_pred = scaler.transform(input_sequence[features].values).reshape(1, 10, len(features))
    X_pred_tensor = torch.tensor(X_pred, dtype=torch.float32).to(device)
    
    with torch.no_grad():
        predicted_price = model(X_pred_tensor).item()
    
    predictions.append({'datetime': current_date, 'predicted_close': round(predicted_price, 6)})
    current_date += timedelta(days=1)

# Pobierz wynik dla `prediction_day` i wyświetl jako JSON
result = next((pred for pred in predictions if pred['datetime'] == prediction_day), None)
if result:
    print(json.dumps({'predicted_close': result['predicted_close']}))
else:
    print(json.dumps({'error': 'Nie udało się uzyskać prognozy'}))
