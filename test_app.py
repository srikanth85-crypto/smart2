from fastapi.testclient import TestClient
from uuid import uuid4

import main

client = TestClient(main.app)


def test_health_endpoint():
    response = client.get('/api/health')
    assert response.status_code == 200
    payload = response.json()
    assert payload['status'] == 'ok'


def test_area_risk_lookup():
    response = client.get('/api/flood-risk/velachery')
    assert response.status_code == 200
    payload = response.json()
    assert payload['id'] == 'velachery'
    assert payload['name'] == 'Velachery'
    assert payload['level'] in {'LOW', 'MODERATE', 'HIGH', 'SEVERE'}


def test_invalid_area_returns_404():
    response = client.get('/api/flood-risk/unknown-zone')
    assert response.status_code == 404


def test_chat_reply_mentions_area():
    response = client.post('/api/chat', json={'message': 'Is Velachery safe?'})
    assert response.status_code == 200
    body = response.json()
    assert 'Velachery' in body['reply']
    assert 'score' in body['reply'].lower()


def test_safe_route_response_has_both_routes():
    response = client.post('/api/safe-route', json={'from_area_id': 'velachery', 'to_area_id': 'adyar'})
    assert response.status_code == 200
    body = response.json()
    assert 'shortest' in body and 'ai_safe' in body
    assert body['shortest']['risk_level'] in {'LOW', 'MODERATE', 'HIGH', 'SEVERE'}
    assert body['ai_safe']['risk_level'] in {'LOW', 'MODERATE', 'HIGH', 'SEVERE'}


def test_weather_reports_demo_provenance_without_live_integration():
    response = client.get('/api/weather?area=velachery')
    assert response.status_code == 200
    payload = response.json()
    assert payload['source'] == 'demo'
    assert 'source_note' in payload


def test_chat_rejects_empty_messages():
    response = client.post('/api/chat', json={'message': ''})
    assert response.status_code == 422


def test_ussd_rejects_empty_session_ids():
    response = client.post('/api/ussd', json={'session_id': '', 'text': '*123#'})
    assert response.status_code == 422


def test_risk_scores_stay_within_documented_bounds():
    assert all(0 <= area['score'] <= 100 for area in main.AREAS)


def test_jwt_login_and_emergency_request_workflow():
    email = f'{uuid4().hex}@example.com'
    registered = client.post('/api/auth/register', json={'email': email, 'password': 'strong-pass-123'})
    assert registered.status_code == 200
    token = registered.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    identity = client.get('/api/auth/me', headers=headers)
    assert identity.status_code == 200
    assert identity.json()['role'] == 'user'

    created = client.post('/api/emergency-requests', headers=headers, json={
        'request_type': 'medical',
        'description': 'Person needs assistance near a flooded junction',
        'area_id': 'velachery',
        'latitude': 12.9756,
        'longitude': 80.2201,
        'priority': 'critical',
    })
    assert created.status_code == 200
    assert created.json()['status'] == 'reported'


def test_protected_identity_requires_bearer_token():
    response = client.get('/api/auth/me')
    assert response.status_code == 401
