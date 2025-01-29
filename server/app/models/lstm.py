# app/models/lstm.py

import torch
import joblib
from app.config import Config  # Import klasy Config

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def load_model_and_scaler():
    # Wczytanie modelu z TorchScript za pomocą ścieżki zdefiniowanej w Config
    model = torch.jit.load(Config.MODEL_PATH)  # Używamy Config.MODEL_PATH
    model = model.to(device)
    model.eval()
    
    # Wczytanie skalera
    scaler = joblib.load(Config.SCALER_PATH)  # Używamy Config.SCALER_PATH
    return model, scaler, device
