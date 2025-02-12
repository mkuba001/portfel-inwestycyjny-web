from flask import request, jsonify
from datetime import datetime
from app.db import db
from app import app
from flasgger import swag_from

#######################################################
#           1. CALCULATE FOREX WALLET & DEPOSIT
#######################################################
@app.route('/api/calculate-forex-wallet', methods=['POST'])
@swag_from({
    'tags': ['Investment'],
    'description': 'Oblicza inwestycje walutowe (normal/reverse) oraz symuluje lokatę (prosty procent).',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'wallet_name': {'type': 'string', 'example': 'USD_PLN_wallet_1'},
                    'normal_budget': {'type': 'number', 'example': 10000},
                    'reverse_budget': {'type': 'number', 'example': 8000},
                    'interest_rate': {'type': 'number', 'example': 10},
                    'reverse_interest_rate': {'type': 'number', 'example': 8},
                    'normal_exchange_rate': {'type': 'number', 'example': 4.0},
                    'reverse_exchange_rate': {'type': 'number', 'example': 3.0},
                    'start_date': {'type': 'string', 'example': '2025-01-01'},
                    'end_date': {'type': 'string', 'example': '2025-07-01'},
                    'duration_months': {'type': 'integer', 'example': 6},
                    'both_sides': {'type': 'boolean', 'example': False},
                    'deposit_budget': {'type': 'number', 'example': 10000},
                    'deposit_annual_rate': {'type': 'number', 'example': 4.0}
                },
                'required': [
                    'wallet_name', 'normal_budget', 'reverse_budget', 'interest_rate',
                    'reverse_interest_rate', 'normal_exchange_rate', 'reverse_exchange_rate',
                    'start_date', 'end_date', 'duration_months'
                ]
            }
        }
    ],
    'responses': {
        200: {'description': 'Wyniki inwestycji forex oraz lokaty'},
        400: {'description': 'Błąd danych wejściowych'},
        500: {'description': 'Błąd serwera'}
    }
})
def calculate_forex_wallet():
    data = request.get_json()
    print("[DEBUG] data:", data)

    # Pobieramy dane dotyczące portfela i walut
    wallet_name = data["wallet_name"]  # np. "USD_PLN_wallet_1"
    parts = wallet_name.split("_")
    base_currency = parts[0]  # np. "USD"
    alt_currency = parts[1]   # np. "PLN"

    # Dane dla symulacji inwestycji walutowych
    normal_budget = float(data["normal_budget"])
    reverse_budget = float(data["reverse_budget"])
    interest_rate = float(data["interest_rate"])
    reverse_interest_rate = float(data["reverse_interest_rate"])
    normal_ex_rate = float(data["normal_exchange_rate"])
    reverse_ex_rate = float(data["reverse_exchange_rate"])
    start_date_str = data["start_date"]
    end_date_str = data["end_date"]
    duration_months = int(data["duration_months"])
    both_sides = data.get("both_sides", False)

    # Dane dla symulacji lokaty (prosty procent)
    deposit_budget = float(data.get("deposit_budget", 0))
    deposit_annual_rate = float(data.get("deposit_annual_rate", 0))

    # Konwersja dat
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
    end_date = datetime.strptime(end_date_str, "%Y-%m-%d")

    results = []

    # 1) SCENARIUSZ NORMAL (np. USD -> PLN)
    normal_collection_name = base_currency + alt_currency  # np. "USDPLN"
    actual_exchange_rate_end_normal = _get_close_from_db(normal_collection_name, end_date)

    normal_doc = _calc_and_insert(
        wallet_name=wallet_name,
        scenario="normal",
        start_date=start_date,
        end_date=end_date,
        start_budget=normal_budget,
        interest_rate=interest_rate,
        user_exchange_rate=normal_ex_rate,
        duration_months=duration_months,
        actual_exchange_rate_end=actual_exchange_rate_end_normal
    )
    results.append(normal_doc)

    # 2) SCENARIUSZ REVERSE (np. PLN -> USD) – jeśli wybrano opcję both_sides
    if both_sides:
        reverse_collection_name = alt_currency + base_currency  # np. "PLNUSD"
        actual_exchange_rate_end_reverse = _get_close_from_db(reverse_collection_name, end_date)

        reverse_doc = _calc_and_insert(
            wallet_name=wallet_name,
            scenario="reverse",
            start_date=start_date,
            end_date=end_date,
            start_budget=reverse_budget,
            interest_rate=reverse_interest_rate,
            user_exchange_rate=reverse_ex_rate,
            duration_months=duration_months,
            actual_exchange_rate_end=actual_exchange_rate_end_reverse
        )
        results.append(reverse_doc)

    # 3) OBLICZANIE LOKATY – prosty (liniowy) procent
    # Obliczamy odsetki:
    #   interest = deposit_budget * (deposit_annual_rate / 100) * (duration_months / 12)
    interest_amount = deposit_budget * (deposit_annual_rate / 100) * (duration_months / 12)
    final_deposit_value = round(deposit_budget + interest_amount, 2)

    # Zapisujemy deposit z tymi samymi datami co inwestycje
    deposit_doc = {
         "scenario": "deposit",
         "deposit_budget": deposit_budget,
         "deposit_annual_rate": deposit_annual_rate,
         "duration_months": duration_months,
         "final_deposit_value": final_deposit_value,
         "start_time": start_date,
         "end_time": end_date,
         "timestamp": datetime.utcnow()
    }
    db[wallet_name].insert_one(deposit_doc)
    deposit_doc.pop("_id", None)

    response = {
        "results": results,
        "deposit_result": deposit_doc
    }
    return jsonify(response), 200

def _get_close_from_db(collection_name, date_value):
    """Pobiera pole 'Close' z danej kolekcji dla określonej daty."""
    record = db[collection_name].find_one({"Date": date_value})
    if record and "Close" in record and record["Close"] > 0:
        return float(record["Close"])
    return None

def _calc_and_insert(wallet_name,
                     scenario,
                     start_date,
                     end_date,
                     start_budget,
                     interest_rate,
                     user_exchange_rate,
                     duration_months,
                     actual_exchange_rate_end=None):
    print(f"[CALC] scenario={scenario}, start_budget={start_budget}, interest_rate={interest_rate}, "
          f"user_ex={user_exchange_rate}, actual_end={actual_exchange_rate_end}")

    if not actual_exchange_rate_end or actual_exchange_rate_end <= 0:
        actual_exchange_rate_end = user_exchange_rate

    n = 12  # miesięczna kapitalizacja przy obliczeniach forex
    r = interest_rate / 100
    T = duration_months

    if actual_exchange_rate_end < user_exchange_rate:
        final_value = round(start_budget * (1 + r / n) ** T, 2)
        currency_conversion = False
        scenario_text = "Scenario 1: actual < user_exchange_rate"
    else:
        final_value = round(start_budget * (1 + r / n) ** T * user_exchange_rate, 2)
        currency_conversion = True
        scenario_text = "Scenario 2: actual >= user_exchange_rate"

    doc = {
        "scenario": scenario,
        "start_budget": start_budget,
        "final_budget": final_value,
        "start_time": start_date,
        "end_time": end_date,
        "interest_rate": interest_rate,
        "user_exchange_rate": user_exchange_rate,
        "actual_end_rate": actual_exchange_rate_end,
        "currency_conversion": currency_conversion,
        "scenario_text": scenario_text,
        "timestamp": datetime.utcnow()
    }

    db[wallet_name].insert_one(doc)
    return {
        "scenario": scenario,
        "final_budget": final_value,
        "interest_rate": interest_rate,
        "user_exchange_rate": user_exchange_rate,
        "actual_end_rate": actual_exchange_rate_end,
        "scenario_text": scenario_text
    }
