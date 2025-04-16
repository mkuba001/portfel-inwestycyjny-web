from flask import request, jsonify
from app.db import db
from app import app
from flasgger import swag_from

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
                    'alternative_currency': {'type': 'string', 'example': 'PLN'},
                    'force_new': {'type': 'boolean', 'example': False}
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
    data = request.get_json()
    base_currency = data["base_currency"]
    alt_currency = data["alternative_currency"]
    force_new = data.get("force_new", False)

    existing_wallets = sorted([
        w for w in db.list_collection_names()
        if w.startswith(f"{base_currency}_{alt_currency}_wallet_")
    ])
    print("DEBUG existing_wallets:", existing_wallets)

    if not existing_wallets:
        new_wallet_name = f"{base_currency}_{alt_currency}_wallet_1"
        db.create_collection(new_wallet_name)
        return jsonify({"wallet_name": new_wallet_name}), 200

    if force_new:
        last_wallet = existing_wallets[-1]  
        last_index = int(last_wallet.split("_")[-1])  # 3
        next_wallet_index = last_index + 1            # 4
        new_wallet_name = f"{base_currency}_{alt_currency}_wallet_{next_wallet_index}"
        db.create_collection(new_wallet_name)
        return jsonify({"wallet_name": new_wallet_name}), 200
    else:
        last_wallet = existing_wallets[-1]
        return jsonify({"wallet_name": last_wallet}), 200



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



@app.route('/api/reset_wallet/<wallet_name>', methods=['DELETE'])
@swag_from({
    'tags': ['Wallet'],
    'description': 'Usuwa wszystkie inwestycje z podanego portfela (ale zostawia pustą kolekcję).',
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

        db[wallet_name].delete_many({})

        return jsonify({'message': f'Portfel {wallet_name} został wyczyszczony (pusta kolekcja)!'}), 200

    except Exception as e:
        return jsonify({'message': f'Błąd serwera: {str(e)}'}), 500