from flask import request, jsonify
from datetime import datetime
import math
from app.db import db  
from app import app
from flasgger import swag_from

@app.route('/api/calculate-usdpln-wallet', methods=['POST'])
@swag_from({
    'tags': ['Investment'],
    'description': 'Oblicza wartość inwestycji USD/PLN na podstawie podanych parametrów i rzeczywistego kursu walutowego na dzień zakończenia inwestycji.',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'wallet_name': {
                        'type': 'string',
                        'example': 'USD_PLN_wallet_1',
                        'description': 'Nazwa portfela, do którego ma być dodana inwestycja'
                    },
                    'budget': {
                        'type': 'number',
                        'example': 20000,
                        'description': 'Kwota początkowej inwestycji (C)'
                    },
                    'interest_rate': {
                        'type': 'number',
                        'example': 10,
                        'description': 'Roczne oprocentowanie inwestycji (r) w procentach'
                    },
                    'exchange_rate': {
                        'type': 'number',
                        'example': 3.75,
                        'description': 'Kurs przewalutowania (K)'
                    },
                    'start_date': {
                        'type': 'string',
                        'format': 'date',
                        'example': '2024-01-10',
                        'description': 'Data rozpoczęcia inwestycji'
                    },
                    'end_date': {
                        'type': 'string',
                        'format': 'date',
                        'example': '2024-04-15',
                        'description': 'Data zakończenia inwestycji'
                    },
                    'duration_months': {
                        'type': 'integer',
                        'example': 3,
                        'description': 'Okres inwestycji w miesiącach (T)'
                    }
                },
                'required': [
                    'wallet_name', 'budget', 'interest_rate', 
                    'exchange_rate', 'start_date', 'end_date', 'duration_months'
                ]
            }
        }
    ],
    'responses': {
        200: {
            'description': 'Wynik obliczeń inwestycji',
            'schema': {
                'type': 'object',
                'properties': {
                    'final_value': {
                        'type': 'number',
                        'description': 'Ostateczna wartość inwestycji'
                    },
                    'scenario': {
                        'type': 'string',
                        'description': 'Wykorzystany scenariusz obliczeń'
                    }
                }
            }
        },
        400: {
            'description': 'Błąd w danych wejściowych lub brak wymaganych danych',
            'schema': {
                'type': 'object',
                'properties': {
                    'message': {
                        'type': 'string',
                        'example': 'Brak wymaganych danych!'
                    }
                }
            }
        },
        500: {
            'description': 'Błąd serwera podczas przetwarzania danych',
            'schema': {
                'type': 'object',
                'properties': {
                    'message': {
                        'type': 'string',
                        'example': 'Błąd serwera: szczegóły błędu'
                    }
                }
            }
        }
    }
})
def calculate_usdpln_wallet():
    try:
        data = request.get_json()

        # 1️⃣ Pobranie nazwy portfela
        wallet_name = data.get("wallet_name")

        if not wallet_name:
            return jsonify({'message': 'Brak nazwy portfela'}), 400

        # Sprawdzenie, czy kolekcja istnieje
        if wallet_name not in db.list_collection_names():
            return jsonify({'message': f'Portfel {wallet_name} nie istnieje!'}), 400

        # 2️⃣ Walidacja danych wejściowych
        required_fields = ['budget', 'interest_rate', 'exchange_rate', 'start_date', 'end_date', 'duration_months']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({'message': f'Brak wymaganych pól: {", ".join(missing_fields)}'}), 400

        try:
            budget = round(float(data['budget']), 2)  # 🔹 Zaokrąglenie do 2 miejsc
            interest_rate = float(data['interest_rate'])
            exchange_rate = float(data['exchange_rate'])
            start_date_str = data['start_date']
            end_date_str = data['end_date']
            duration_months = int(data['duration_months'])
        except (ValueError, TypeError):
            return jsonify({'message': 'Nieprawidłowe typy danych.'}), 400

        # 3️⃣ Konwersja dat
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        except ValueError:
            return jsonify({'message': 'Nieprawidłowy format daty! Użyj formatu: YYYY-MM-DD'}), 400

        if end_date <= start_date:
            return jsonify({'message': 'Data zakończenia inwestycji musi być późniejsza niż data rozpoczęcia!'}), 400

        # 4️⃣ Pobierz rzeczywisty kurs walutowy na dzień zakończenia inwestycji
        usdpln_record = db.USDPLN.find_one({'Date': end_date})
        if not usdpln_record:
            return jsonify({'message': 'Brak danych kursu walutowego na dzień zakończenia inwestycji!'}), 400

        try:
            actual_exchange_rate = float(usdpln_record.get('Close', 0))
        except (ValueError, TypeError):
            return jsonify({'message': 'Nieprawidłowy kurs walutowy na podaną datę!'}), 400

        if actual_exchange_rate == 0:
            return jsonify({'message': 'Nieprawidłowy kurs walutowy na dzień zakończenia inwestycji!'}), 400

        # 5️⃣ Obliczenia na podstawie scenariuszy
        n = 12  
        r = interest_rate / 100  
        T = duration_months

        if actual_exchange_rate < exchange_rate:
            final_value = round(budget * (1 + r / n) ** T, 2)  # 🔹 Zaokrąglenie do 2 miejsc
            currency_conversion = False
            scenario = 'Scenariusz 1: Kurs rzeczywisty < Kurs przewalutowania'
        else:
            final_value = round(budget * (1 + r / n) ** T * exchange_rate, 2)  # 🔹 Zaokrąglenie do 2 miejsc
            currency_conversion = True
            scenario = 'Scenariusz 2: Kurs rzeczywisty >= Kurs przewalutowania'

        # 6️⃣ Zapisz wynik do właściwego portfela
        result_document = {
            'start_budget': budget,
            'final_budget': final_value,
            'start_time': start_date,
            'end_time': end_date,
            'currency_conversion': currency_conversion,
            'scenario': scenario,
            'timestamp': datetime.utcnow()
        }

        try:
            insert_result = db[wallet_name].insert_one(result_document)  
        except Exception as db_error:
            return jsonify({'message': f'Błąd podczas zapisywania do bazy danych: {str(db_error)}'}), 500

        return jsonify({
            'final_value': final_value,
            'scenario': scenario,
            'record_id': str(insert_result.inserted_id)
        }), 200

    except Exception as e:
        return jsonify({'message': f'Błąd serwera: {str(e)}'}), 500