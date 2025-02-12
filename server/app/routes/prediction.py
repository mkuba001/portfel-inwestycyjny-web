
# from flask import request, jsonify
# from datetime import datetime
# from subprocess import check_output, CalledProcessError
# import json
# from app import app
# import pytz
# from app.db import db
# from flasgger import swag_from
# from bson import ObjectId
# from dateutil.relativedelta import relativedelta

# def calculate_months(start_date, prediction_date):
#     rd = relativedelta(prediction_date, start_date)
#     return rd.years * 12 + rd.months + (1 if rd.days >= 15 else 0)  # Zaokrąglanie w górę, jeśli przekroczono połowę miesiąca

# @app.route('/api/predict', methods=['POST'])
# @swag_from({
#     'tags': ['Predictions'],
#     'description': 'Wykonuje prognozę inwestycji i zapisuje ją w kolekcji prediction_forex.',
#     'parameters': [
#         {
#             'name': 'body',
#             'in': 'body',
#             'required': True,
#             'schema': {
#                 'type': 'object',
#                 'properties': {
#                     'base_currency': {'type': 'string', 'example': 'USD'},
#                     'alternative_currency': {'type': 'string', 'example': 'PLN'},
#                     'start_date': {'type': 'string', 'format': 'date', 'example': '2024-01-10'},
#                     'prediction_date': {'type': 'string', 'format': 'date', 'example': '2024-02-10'}
#                 },
#                 'required': ['base_currency', 'alternative_currency', 'start_date', 'prediction_date']
#             }
#         }
#     ],
#     'responses': {
#         201: {'description': 'Prognoza dodana do bazy danych'},
#         400: {'description': 'Błąd w danych wejściowych'},
#         500: {'description': 'Błąd serwera'}
#     }
# })
# def prediction():
#     print("🔹 Otrzymano żądanie POST na /api/predict")

#     # 📌 Pobranie danych z requesta
#     data = request.get_json()
#     base_currency = data.get('base_currency')
#     alternative_currency = data.get('alternative_currency')
#     start_date_str = data.get('start_date')
#     prediction_date_str = data.get('prediction_date')

#     # 📌 Walidacja danych wejściowych
#     if not all([base_currency, alternative_currency, start_date_str, prediction_date_str]):
#         return jsonify({'message': 'Brak wymaganych danych!'}), 400

#     try:
#         # 📌 Konwersja dat
#         start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
#         prediction_date = datetime.strptime(prediction_date_str, '%Y-%m-%d')

#         if prediction_date <= start_date:
#             return jsonify({'message': 'Data predykcji musi być późniejsza niż data początkowa!'}), 400

#         # 📌 Obliczanie liczby miesięcy inwestycji
#         investment_months = calculate_months(start_date, prediction_date)
#     except ValueError:
#         return jsonify({'message': 'Błędny format daty! Użyj formatu: YYYY-MM-DD'}), 400

#     try:
#         # 📌 Symulowana predykcja modelu LSTM (tutaj podmień na rzeczywiste wartości)
#         predicted_close = round(1.09114, 5)  # 🔹 Zaokrąglenie do 5 miejsc po przecinku

#         # ✅ Sprawdzenie, czy taka predykcja już istnieje
#         existing_prediction = db.prediction_forex.find_one({
#             'base_currency': base_currency,
#             'alternative_currency': alternative_currency,
#             'start_date': start_date,
#             'prediction_date': prediction_date
#         })

#         if existing_prediction:
#             return jsonify({
#                 'message': 'Prognoza już istnieje, nie została dodana ponownie',
#                 'predicted_close': existing_prediction['predicted_close'],
#                 'investment_duration_months': existing_prediction['investment_duration_months']
#             }), 200

#         # 📌 Tworzenie dokumentu do zapisania
#         document = {
#             'base_currency': base_currency,
#             'alternative_currency': alternative_currency,
#             'start_date': start_date,
#             'prediction_date': prediction_date,
#             'predicted_close': predicted_close,
#             'investment_duration_months': investment_months,
#             'timestamp': datetime.utcnow()
#         }

#         # 📌 Zapis do bazy danych w kolekcji prediction_forex
#         db.prediction_forex.insert_one(document)

#         return jsonify({
#             'message': 'Prognoza została pomyślnie dodana do prediction_forex',
#             'predicted_close': predicted_close,
#             'investment_duration_months': investment_months
#         }), 201

#     except Exception as e:
#         return jsonify({'message': f'Błąd podczas przetwarzania danych: {str(e)}'}), 500

from flask import request, jsonify
from datetime import datetime
import subprocess
import shlex
import json
from app import app
from app.db import db
from dateutil.relativedelta import relativedelta

def calculate_months(start_date, prediction_date):
    rd = relativedelta(prediction_date, start_date)
    return rd.years * 12 + rd.months + (1 if rd.days >= 15 else 0)

@app.route('/api/predict', methods=['POST'])
def prediction():
    print("🔹 Otrzymano żądanie POST na /api/predict")

    # 1. Debug: wypisanie JSON-a wejściowego
    data = request.get_json()
    print(f"[DEBUG] Otrzymane dane (JSON): {data}")

    base_currency = data.get('base_currency')
    alternative_currency = data.get('alternative_currency')
    start_date_str = data.get('start_date')
    prediction_date_str = data.get('prediction_date')

    # Walidacja
    if not all([base_currency, alternative_currency, start_date_str, prediction_date_str]):
        print("[DEBUG] Brak wymaganych danych w JSON-ie")
        return jsonify({'message': 'Brak wymaganych danych!'}), 400

    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        prediction_date = datetime.strptime(prediction_date_str, '%Y-%m-%d')
        if prediction_date <= start_date:
            print("[DEBUG] Data predykcji <= data początkowa")
            return jsonify({'message': 'Data predykcji musi być późniejsza niż data początkowa!'}), 400

        investment_months = calculate_months(start_date, prediction_date)
    except ValueError:
        print("[DEBUG] Błędny format daty!")
        return jsonify({'message': 'Błędny format daty! Użyj formatu YYYY-MM-DD'}), 400

    print(f"[DEBUG] obliczone investment_months = {investment_months}")

    # Ustalanie row_count
    if investment_months <= 2:
        row_count = 60
    else:
        row_count = 2 * investment_months * 30
    print(f"[DEBUG] row_count = {row_count}")

    # 2. Subproces z parametrami
    cmd = f"python C:/Users/Kuba/Desktop/STUDIA/mgr/portfel-inwestycyjny/models/pred2.py --start_date={start_date_str} --prediction_date={prediction_date_str}"
    print(f"[DEBUG] Uruchamiam subproces z cmd: {cmd}")

    try:
        result = subprocess.run(
            shlex.split(cmd),
            capture_output=True,
            text=True,
            check=True
        )
        # Debug zwróconego kodu i wyjść
        print(f"[DEBUG] Subprocess returncode: {result.returncode}")
        print(f"[DEBUG] Subprocess STDOUT:\n{result.stdout}")
        print(f"[DEBUG] Subprocess STDERR:\n{result.stderr}")

        output_str = result.stdout.strip()
        predictions_all = json.loads(output_str)

        print("[DEBUG] Odczytano JSON z subprocesu (predictions_all)")

    except subprocess.CalledProcessError as e:
        print(f"[Błąd subprocesu] returncode={e.returncode}, stdout={e.output}, stderr={e.stderr}")
        return jsonify({'message': f'Błąd subprocesu: {str(e)}'}), 500
    except Exception as e:
        print(f"[DEBUG] Błąd odczytu JSON: {e}")
        return jsonify({'message': f'Błąd odczytu JSON z subprocesu: {str(e)}'}), 500

    # 3. Pomocnicza funkcja do wzięcia ostatniej predykcji
    def get_last_pred(key_name):
        arr = predictions_all.get(key_name, [])
        if arr:
            return arr[-1].get("Predicted", None)
        return None

    final_xgb  = get_last_pred("predictions_xgboost")
    final_rf   = get_last_pred("predictions_rf")
    final_lstm = get_last_pred("predictions_lstm")
    final_ari  = get_last_pred("predictions_arima")

    # Debug finalnych wartości
    print(f"[DEBUG] final_xgb={final_xgb}, final_rf={final_rf}, final_lstm={final_lstm}, final_arima={final_ari}")

    # 4. Zapis do bazy
    doc = {
        'base_currency': base_currency,
        'alternative_currency': alternative_currency,
        'start_date': start_date,
        'prediction_date': prediction_date,
        'final_xgb': final_xgb,
        'final_rf': final_rf,
        'final_lstm': final_lstm,
        'final_arima': final_ari,
        'investment_duration_months': investment_months,
        'timestamp': datetime.utcnow()
    }
    db.prediction_forex.insert_one(doc)
    print("[DEBUG] Zapisano dokument w bazie prediction_forex")

    # 5. Zwracamy do frontu
    return jsonify({
        'message': 'Prognoza zapisana w bazie (ostatnie wartości). Poniżej pełen przebieg predykcji do wykresu.',
        'final_xgb': final_xgb,
        'final_rf': final_rf,
        'final_lstm': final_lstm,
        'final_arima': final_ari,
        'predictions': predictions_all,
        'investment_duration_months': investment_months
    }), 201


@app.route('/api/historical-data', methods=['GET'])
def historical_data():
    # Pobieramy parametry zapytania
    base = request.args.get("base")
    alt = request.args.get("alt")
    start_date_str = request.args.get("start_date")
    end_date_str = request.args.get("end_date")

    # Sprawdzamy, czy wszystkie wymagane parametry są podane
    if not base or not alt or not start_date_str or not end_date_str:
        return jsonify({"message": "Missing required query parameters: base, alt, start_date, end_date"}), 400

    try:
        # Konwertujemy daty do obiektów datetime
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
    except Exception as e:
        return jsonify({"message": "Invalid date format. Use YYYY-MM-DD."}), 400

    # Budujemy nazwę kolekcji – zakładamy, że dane historyczne zapisane są w kolekcji o nazwie base+alt, np. "USDPLN"
    collection_name = base + alt

    try:
        # Pobieramy dokumenty, które mają pole "Date" w zadanym przedziale
        # Zakładamy, że pole "Date" jest zapisane jako obiekt datetime w bazie lub jako ciąg znaków w formacie "YYYY-MM-DD"
        historical_docs = list(db[collection_name].find(
            {"Date": {"$gte": start_date, "$lte": end_date}},
            {"_id": 0}  # wykluczamy pole _id
        ))
    except Exception as e:
        return jsonify({"message": f"Error fetching historical data: {str(e)}"}), 500

    return jsonify({"historical": historical_docs}), 200