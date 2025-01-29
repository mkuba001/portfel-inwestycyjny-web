# # app/routes/prediction.py
# from flask import request, jsonify
# from datetime import datetime
# from subprocess import check_output, CalledProcessError
# import json
# from app import app
# from app.db import db
# from flasgger import swag_from
# from bson import ObjectId
# from dateutil.relativedelta import relativedelta



# @app.route('/api/predict', methods=['POST'])
# @swag_from({
#     'tags': ['Predictions'],
#     'description': 'Wykonaj prognozę na podstawie historycznych danych i modelu LSTM.',
#     'parameters': [
#         {
#             'name': 'body',
#             'in': 'body',
#             'required': True,
#             'schema': {
#                 'type': 'object',
#                 'properties': {
#                     'base_currency': {
#                         'type': 'string',
#                         'example': 'USD',
#                         'description': 'Waluta bazowa do prognozy'
#                     },
#                     'alternative_currency': {
#                         'type': 'string',
#                         'example': 'EUR',
#                         'description': 'Alternatywna waluta do prognozy'
#                     },
#                     'start_date': {
#                         'type': 'string',
#                         'format': 'date',
#                         'example': '2024-01-10',
#                         'description': 'Data początkowa do prognozy'
#                     },
#                     'prediction_date': {
#                         'type': 'string',
#                         'format': 'date',
#                         'example': '2024-02-10',
#                         'description': 'Data końcowa do prognozy'
#                     }
#                 },
#                 'required': ['base_currency', 'alternative_currency', 'start_date', 'prediction_date']
#             }
#         }
#     ],
#     'responses': {
#         201: {
#             'description': 'Prognoza została pomyślnie dodana do bazy danych',
#             'schema': {
#                 'type': 'object',
#                 'properties': {
#                     'message': {'type': 'string', 'example': 'Prognoza została pomyślnie dodana do bazy danych'},
#                     'predicted_close': {'type': 'number', 'example': 1.09114}
#                 }
#             }
#         },
#         400: {
#             'description': 'Błąd w danych wejściowych',
#             'schema': {
#                 'type': 'object',
#                 'properties': {
#                     'message': {'type': 'string', 'example': 'Brak wymaganych danych!'}
#                 }
#             }
#         },
#         500: {
#             'description': 'Błąd serwera podczas przetwarzania danych',
#             'schema': {
#                 'type': 'object',
#                 'properties': {
#                     'message': {'type': 'string', 'example': 'Błąd podczas uruchamiania programu: <szczegóły błędu>'}
#                 }
#             }
#         }
#     }
# })
# def prediction():
#     data = request.get_json()
#     base_currency = data.get('base_currency')
#     alternative_currency = data.get('alternative_currency')
#     start_date = data.get('start_date')
#     prediction_date = data.get('prediction_date')
    
#     # Walidacja danych wejściowych
#     if not all([base_currency, alternative_currency, start_date, prediction_date]):
#         return jsonify({'message': 'Brak wymaganych danych!'}), 400
    
#     try:
#         # Konwersja dat
#         start_date = datetime.strptime(start_date, '%Y-%m-%d')
#         prediction_date = datetime.strptime(prediction_date, '%Y-%m-%d')
#     except ValueError:
#         return jsonify({'message': 'Błędny format daty! Użyj formatu: YYYY-MM-DD'}), 400

#     try:
#         # Uruchomienie skryptu jako subprocess z argumentami
#         result = check_output([
#             'python', r'C:\Users\Kuba\Desktop\STUDIA\mgr\portfel-inwestycyjny\web\server\app\models\test.py',
#             '--start_date', start_date.strftime('%Y-%m-%d'),
#             '--prediction_date', prediction_date.strftime('%Y-%m-%d')
#         ])
        
#         # Przetworzenie wyniku JSON
#         result_data = json.loads(result)
#         predicted_close = result_data.get('predicted_close')

#         if predicted_close is None:
#             return jsonify({'message': 'Nie udało się uzyskać prognozy'}), 500
        
#         # Zapisanie wyniku do bazy danych
#         db.predictions.insert_one({
#             'base_currency': base_currency,
#             'alternative_currency': alternative_currency,
#             'start_date': start_date,
#             'prediction_date': prediction_date,
#             'predicted_close': predicted_close
#         })
        
#         return jsonify({
#             'message': 'Prognoza została pomyślnie dodana do bazy danych',
#             'predicted_close': predicted_close
#         }), 201
    
#     except CalledProcessError as e:
#         return jsonify({'message': f'Błąd podczas uruchamiania programu: {e}'}), 500



# @app.route('/api/latest_prediction', methods=['GET'])
# @swag_from({
#     'tags': ['Predictions'],
#     'description': 'Pobierz najnowszą predykcję zapisaną w bazie danych.',
#     'responses': {
#         200: {
#             'description': 'Najnowsza predykcja',
#             'schema': {
#                 'type': 'object',
#                 'properties': {
#                     '_id': {'type': 'string', 'description': 'ID predykcji'},
#                     'base_currency': {'type': 'string', 'description': 'Waluta bazowa'},
#                     'alternative_currency': {'type': 'string', 'description': 'Alternatywna waluta'},
#                     'start_date': {'type': 'string', 'format': 'date', 'description': 'Data początkowa'},
#                     'prediction_date': {'type': 'string', 'format': 'date', 'description': 'Data predykcji'},
#                     'predicted_close': {'type': 'number', 'description': 'Prognozowana wartość zamknięcia'}
#                 }
#             }
#         },
#         404: {
#             'description': 'Brak dostępnych predykcji'
#         }
#     }
# })


# def get_latest_prediction():
#     try:
#         # Pobieranie ostatnio dodanego wpisu na podstawie _id
#         latest_prediction = db.predictions.find().sort('_id', -1).limit(1)
#         latest_prediction = list(latest_prediction)  # Konwersja na listę

#         if latest_prediction:
#             latest_prediction = latest_prediction[0]  # Pobranie pierwszego dokumentu z listy
#             # Konwersja ObjectId na string do serializacji JSON
#             latest_prediction['_id'] = str(latest_prediction['_id'])
#             return jsonify(latest_prediction), 200
#         else:
#             return jsonify({'message': 'No predictions found in the database.'}), 404

#     except Exception as e:
#         return jsonify({'message': f'Error fetching latest prediction: {str(e)}'}), 500


from flask import request, jsonify
from datetime import datetime
from subprocess import check_output, CalledProcessError
import json
from app import app
import pytz
from app.db import db
from flasgger import swag_from
from bson import ObjectId
from dateutil.relativedelta import relativedelta

def calculate_months(start_date, prediction_date):
    rd = relativedelta(prediction_date, start_date)
    return rd.years * 12 + rd.months + (1 if rd.days >= 15 else 0)  # Zaokrąglanie w górę, jeśli przekroczono połowę miesiąca

@app.route('/api/predict', methods=['POST'])
@swag_from({
    'tags': ['Predictions'],
    'description': 'Wykonuje prognozę inwestycji i zapisuje ją w odpowiednim portfelu.',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'base_currency': {'type': 'string', 'example': 'USD'},
                    'alternative_currency': {'type': 'string', 'example': 'PLN'},
                    'start_date': {'type': 'string', 'format': 'date', 'example': '2024-01-10'},
                    'prediction_date': {'type': 'string', 'format': 'date', 'example': '2024-02-10'}
                },
                'required': ['base_currency', 'alternative_currency', 'start_date', 'prediction_date']
            }
        }
    ],
    'responses': {
        201: {'description': 'Prognoza dodana do bazy danych'},
        400: {'description': 'Błąd w danych wejściowych'},
        500: {'description': 'Błąd serwera'}
    }
})
def prediction():
    print("🔹 Otrzymano żądanie POST na /api/predict")

    # 📌 Pobranie danych z requesta
    data = request.get_json()
    base_currency = data.get('base_currency')
    alternative_currency = data.get('alternative_currency')
    start_date_str = data.get('start_date')
    prediction_date_str = data.get('prediction_date')

    # 📌 Walidacja danych wejściowych
    if not all([base_currency, alternative_currency, start_date_str, prediction_date_str]):
        return jsonify({'message': 'Brak wymaganych danych!'}), 400

    try:
        # 📌 Konwersja dat
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        prediction_date = datetime.strptime(prediction_date_str, '%Y-%m-%d')

        if prediction_date <= start_date:
            return jsonify({'message': 'Data predykcji musi być późniejsza niż data początkowa!'}), 400

        # 📌 Obliczanie liczby miesięcy inwestycji
        investment_months = calculate_months(start_date, prediction_date)
    except ValueError:
        return jsonify({'message': 'Błędny format daty! Użyj formatu: YYYY-MM-DD'}), 400

    try:
        # 📌 Symulowana predykcja modelu LSTM (tutaj podmień na rzeczywiste wartości)
        predicted_close = round(1.09114, 5)  # 🔹 Zaokrąglenie do 5 miejsc po przecinku

        # 📌 Tworzenie nazwy portfela dynamicznie
        existing_wallets = db.list_collection_names()
        wallet_index = sum(1 for name in existing_wallets if name.startswith(f"{base_currency}_{alternative_currency}_wallet")) + 1
        wallet_name = f"{base_currency}_{alternative_currency}_wallet_{wallet_index}"

        # 📌 Sprawdzenie, czy portfel już istnieje
        if wallet_name not in db.list_collection_names():
            db.create_collection(wallet_name)

        # 📌 Tworzenie dokumentu do zapisania
        document = {
            'base_currency': base_currency,
            'alternative_currency': alternative_currency,
            'start_date': start_date,
            'prediction_date': prediction_date,
            'predicted_close': predicted_close,
            'investment_duration_months': investment_months,
            'timestamp': datetime.utcnow()
        }

        # 📌 Zapis do bazy danych w odpowiednim portfelu
        db[wallet_name].insert_one(document)

        return jsonify({
            'message': 'Prognoza została pomyślnie dodana do bazy danych',
            'wallet_name': wallet_name,
            'predicted_close': predicted_close,
            'investment_duration_months': investment_months
        }), 201

    except Exception as e:
        return jsonify({'message': f'Błąd podczas przetwarzania danych: {str(e)}'}), 500







# @app.route('/api/predict', methods=['POST'])
# @swag_from({
#     'tags': ['Predictions'],
#     'description': 'Wykonaj prognozę na podstawie historycznych danych i modelu LSTM.',
#     'parameters': [
#         {
#             'name': 'body',
#             'in': 'body',
#             'required': True,
#             'schema': {
#                 'type': 'object',
#                 'properties': {
#                     'base_currency': {
#                         'type': 'string',
#                         'example': 'USD',
#                         'description': 'Waluta bazowa do prognozy'
#                     },
#                     'alternative_currency': {
#                         'type': 'string',
#                         'example': 'EUR',
#                         'description': 'Alternatywna waluta do prognozy'
#                     },
#                     'start_date': {
#                         'type': 'string',
#                         'format': 'date',
#                         'example': '2024-01-10',
#                         'description': 'Data początkowa do prognozy'
#                     },
#                     'prediction_date': {
#                         'type': 'string',
#                         'format': 'date',
#                         'example': '2024-02-10',
#                         'description': 'Data końcowa do prognozy'
#                     }
#                 },
#                 'required': ['base_currency', 'alternative_currency', 'start_date', 'prediction_date']
#             }
#         }
#     ],
#     'responses': {
#         201: {
#             'description': 'Prognoza została pomyślnie dodana do bazy danych',
#             'schema': {
#                 'type': 'object',
#                 'properties': {
#                     'message': {'type': 'string', 'example': 'Prognoza została pomyślnie dodana do bazy danych'},
#                     'predicted_close': {'type': 'number', 'example': 1.09114},
#                     'investment_duration_months': {'type': 'integer', 'example': 1}
#                 }
#             }
#         },
#         400: {
#             'description': 'Błąd w danych wejściowych',
#             'schema': {
#                 'type': 'object',
#                 'properties': {
#                     'message': {'type': 'string', 'example': 'Brak wymaganych danych!'}
#                 }
#             }
#         },
#         500: {
#             'description': 'Błąd serwera podczas przetwarzania danych',
#             'schema': {
#                 'type': 'object',
#                 'properties': {
#                     'message': {'type': 'string', 'example': 'Błąd podczas uruchamiania programu: <szczegóły błędu>'}
#                 }
#             }
#         }
#     }
# })
# def prediction():
#     data = request.get_json()
#     base_currency = data.get('base_currency')
#     alternative_currency = data.get('alternative_currency')
#     start_date_str = data.get('start_date')
#     prediction_date_str = data.get('prediction_date')
    
#     # Walidacja danych wejściowych
#     if not all([base_currency, alternative_currency, start_date_str, prediction_date_str]):
#         return jsonify({'message': 'Brak wymaganych danych!'}), 400
    
#     try:
#         # Konwersja dat
#         start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
#         prediction_date = datetime.strptime(prediction_date_str, '%Y-%m-%d')
        
#         if prediction_date <= start_date:
#             return jsonify({'message': 'Data predykcji musi być późniejsza niż data początkowa!'}), 400
        
#         # Obliczanie liczby miesięcy inwestycji
#         investment_months = calculate_months(start_date, prediction_date)
        
#     except ValueError:
#         return jsonify({'message': 'Błędny format daty! Użyj formatu: YYYY-MM-DD'}), 400

#     try:
#         # Uruchomienie skryptu jako subprocess z argumentami
#         result = check_output([
#             'python', r'C:\Users\Kuba\Desktop\STUDIA\mgr\portfel-inwestycyjny\web\server\app\models\test.py',
#             '--start_date', start_date.strftime('%Y-%m-%d'),
#             '--prediction_date', prediction_date.strftime('%Y-%m-%d')
#         ])
        
#         # Przetworzenie wyniku JSON
#         result_data = json.loads(result)
#         predicted_close = result_data.get('predicted_close')

#         if predicted_close is None:
#             return jsonify({'message': 'Nie udało się uzyskać prognozy'}), 500
        
#         # Zapisanie wyniku do bazy danych
#         db.predictions.insert_one({
#             'base_currency': base_currency,
#             'alternative_currency': alternative_currency,
#             'start_date': start_date,
#             'prediction_date': prediction_date,
#             'predicted_close': predicted_close,
#             'investment_duration_months': investment_months  # Nowe pole
#         })
        
#         return jsonify({
#             'message': 'Prognoza została pomyślnie dodana do bazy danych',
#             'predicted_close': predicted_close,
#             'investment_duration_months': investment_months  # Zwracanie liczby miesięcy
#         }), 201
    
#     except CalledProcessError as e:
#         return jsonify({'message': f'Błąd podczas uruchamiania programu: {e}'}), 500
    
