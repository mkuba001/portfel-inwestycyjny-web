from flask import request, jsonify
from app.db import db
from app import app
from flasgger import swag_from

# 📌 Tworzenie nowego portfela inwestycyjnego
@app.route('/api/start_new_wallet', methods=['POST'])
@swag_from({
    'tags': ['Wallet'],
    'description': 'Tworzy nowy portfel inwestycyjny na podstawie podanej pary walutowej.',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'base_currency': {'type': 'string', 'example': 'USD'},
                    'alternative_currency': {'type': 'string', 'example': 'PLN'}
                },
                'required': ['base_currency', 'alternative_currency']
            }
        }
    ],
    'responses': {
        200: {'description': 'Nowy portfel został utworzony'},
        400: {'description': 'Brak wymaganych danych'},
        500: {'description': 'Błąd serwera'}
    }
})
def start_new_wallet():
    try:
        data = request.get_json()
        base_currency = data.get('base_currency')
        alternative_currency = data.get('alternative_currency')

        if not base_currency or not alternative_currency:
            return jsonify({'message': 'Brak wymaganych danych'}), 400

        # 🔹 Dynamiczne tworzenie nowego portfela
        existing_wallets = db.list_collection_names()
        wallet_index = sum(1 for name in existing_wallets if name.startswith(f"{base_currency}_{alternative_currency}_wallet")) + 1
        new_wallet_name = f"{base_currency}_{alternative_currency}_wallet_{wallet_index}"

        # 🔹 Tworzenie kolekcji w bazie
        db.create_collection(new_wallet_name)

        return jsonify({'message': 'Nowy portfel utworzony!', 'wallet_name': new_wallet_name}), 200

    except Exception as e:
        return jsonify({'message': f'Błąd serwera: {str(e)}'}), 500


# 📌 Pobranie listy wszystkich portfeli inwestycyjnych
@app.route('/api/get_wallets', methods=['GET'])
@swag_from({
    'tags': ['Wallet'],
    'description': 'Zwraca listę wszystkich portfeli inwestycyjnych zapisanych w bazie danych.',
    'responses': {
        200: {'description': 'Lista portfeli'},
        500: {'description': 'Błąd serwera'}
    }
})
def get_wallets():
    try:
        collections = db.list_collection_names()
        wallets = [name for name in collections if "_wallet_" in name]
        return jsonify({'wallets': wallets}), 200

    except Exception as e:
        return jsonify({'message': f'Błąd serwera: {str(e)}'}), 500


# 📌 Pobranie danych konkretnego portfela inwestycyjnego
@app.route('/api/get_wallet_data/<wallet_name>', methods=['GET'])
@swag_from({
    'tags': ['Wallet'],
    'description': 'Zwraca szczegóły inwestycji zapisanych w danym portfelu inwestycyjnym.',
    'parameters': [
        {
            'name': 'wallet_name',
            'in': 'path',
            'type': 'string',
            'required': True,
            'example': 'USD_PLN_wallet_1'
        }
    ],
    'responses': {
        200: {'description': 'Dane portfela'},
        404: {'description': 'Portfel nie istnieje'},
        500: {'description': 'Błąd serwera'}
    }
})
def get_wallet_data(wallet_name):
    try:
        if wallet_name not in db.list_collection_names():
            return jsonify({'message': 'Portfel nie istnieje'}), 404

        investments = list(db[wallet_name].find({}, {'_id': 0}))
        return jsonify({'wallet_name': wallet_name, 'investments': investments}), 200

    except Exception as e:
        return jsonify({'message': f'Błąd serwera: {str(e)}'}), 500


# 📌 Resetowanie portfela (usunięcie wszystkich inwestycji)
@app.route('/api/reset_wallet/<wallet_name>', methods=['DELETE'])
@swag_from({
    'tags': ['Wallet'],
    'description': 'Usuwa wszystkie inwestycje z podanego portfela.',
    'parameters': [
        {
            'name': 'wallet_name',
            'in': 'path',
            'type': 'string',
            'required': True,
            'example': 'USD_PLN_wallet_1'
        }
    ],
    'responses': {
        200: {'description': 'Portfel został zresetowany'},
        404: {'description': 'Portfel nie istnieje'},
        500: {'description': 'Błąd serwera'}
    }
})
def reset_wallet(wallet_name):
    try:
        if wallet_name not in db.list_collection_names():
            return jsonify({'message': 'Portfel nie istnieje'}), 404

        db[wallet_name].drop()  # 🟢 Usuwamy kolekcję portfela
        return jsonify({'message': f'Portfel {wallet_name} został zresetowany!'}), 200

    except Exception as e:
        return jsonify({'message': f'Błąd serwera: {str(e)}'}), 500
