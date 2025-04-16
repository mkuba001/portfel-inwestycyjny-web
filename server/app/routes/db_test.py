from flask import jsonify
from flasgger import swag_from
from app.db import db
from app import app

@app.route('/api/connection_test', methods=['GET'])
@swag_from({
    'tags': ['Database'],
    'description': 'Testuj połączenie z bazą danych',
    'responses': {
        200: {
            'description': 'Połączenie działa poprawnie',
            'schema': {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string'},
                    'document_count': {'type': 'integer', 'example': 5}
                }
            }
        },
        500: {
            'description': 'Błąd połączenia z bazą danych',
            'schema': {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string'},
                    'error': {'type': 'string'}
                }
            }
        }
    }
})
def connection_test():
    try:
        document_count = db.predictions.count_documents({})
        return jsonify({
            'message': 'Połączenie działa poprawnie!',
            'document_count': document_count
        }), 200
    except Exception as e:
        return jsonify({
            'message': 'Błąd połączenia z bazą danych!',
            'error': str(e)
        }), 500
