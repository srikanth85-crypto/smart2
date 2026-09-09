from fastapi.testclient import TestClient
from uuid import uuid4

import main
from db import SessionLocal, User, UserRole

client = TestClient(main.app)


def test_health_endpoint():
    response = client.get('/api/health')
    assert response.status_code == 200
    payload = response.json()
    assert payload['status'] == 'ok'
    assert 'ai' in payload
    assert payload['version'] == '2.0.0'


def test_frontend_is_served_by_api():
    response = client.get('/')
    assert response.status_code == 200
    assert 'FloodSafe Chennai' in response.text


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
    assert 'ai' in body


def test_ai_triage_routes_medical_report():
    response = client.post('/api/ai/triage', json={
        'description': 'A patient needs insulin and medical evacuation',
        'area_id': 'velachery',
    })
    assert response.status_code == 200
    payload = response.json()
    assert payload['report_type'] == 'medical'
    assert payload['department'] == 'Emergency Medical Services'
    assert payload['priority'] == 'critical'
    assert payload['risk_level'] in {'LOW', 'MODERATE', 'HIGH', 'SEVERE'}


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


def test_flood_report_is_stored_and_routed():
    response = client.post('/api/flood-reports', json={
        'report_type': 'wire_cut',
        'description': 'Live wire has fallen into flood water near Velachery',
        'area_id': 'velachery',
        'latitude': 12.9756,
        'longitude': 80.2201,
        'priority': 'critical',
    })
    assert response.status_code == 200
    payload = response.json()
    assert payload['stored'] is True
    assert payload['status'] == 'reported'
    assert payload['department'] == 'Electricity Board + Fire Rescue'
    assert payload['area_name'] == 'Velachery'


def test_medical_report_is_critical_and_routes_to_ambulance():
    response = client.post('/api/flood-reports', json={
        'report_type': 'medical',
        'description': 'Insulin is needed at a flooded home',
        'area_id': 'velachery',
        'latitude': 12.9756,
        'longitude': 80.2201,
        'priority': 'low',
    })
    assert response.status_code == 200
    payload = response.json()
    assert payload['department'] == 'Emergency Medical Services'
    assert payload['priority'] == 'critical'


def test_ambulance_can_agree_or_disagree_with_queue_item():
    email = f'ambulance-{uuid4().hex}@example.com'
    registered = client.post('/api/auth/register', json={'email': email, 'password': 'strong-pass-123'})
    user_id = registered.json()['user']['id']
    session = SessionLocal()
    try:
        session.get(User, user_id).role = UserRole.AMBULANCE.value
        session.commit()
    finally:
        session.close()
    token = client.post('/api/auth/login', json={'email': email, 'password': 'strong-pass-123'}).json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    report = client.post('/api/flood-reports', json={
        'report_type': 'medical', 'description': 'Urgent patient transfer', 'area_id': 'velachery',
        'latitude': 12.9756, 'longitude': 80.2201, 'priority': 'critical',
    }).json()
    agreed = client.post(f"/api/emergency-requests/{report['id']}/decision", headers=headers, json={'decision': 'agree'})
    assert agreed.status_code == 200
    assert agreed.json()['status'] == 'assigned'
    second = client.post('/api/flood-reports', json={
        'report_type': 'medical', 'description': 'Second patient request', 'area_id': 'guindy',
        'latitude': 13.0067, 'longitude': 80.2206, 'priority': 'critical',
    }).json()
    declined = client.post(f"/api/emergency-requests/{second['id']}/decision", headers=headers, json={'decision': 'disagree'})
    assert declined.status_code == 200
    queue = client.get('/api/emergency-requests', headers=headers).json()
    assert second['id'] not in {item['id'] for item in queue}


def test_ussd_requires_language_before_menu():
    first = client.post('/api/ussd', json={'session_id': 'language-test', 'text': '*123#'})
    assert first.status_code == 200
    assert 'English' in first.json()['response']
    selected = client.post('/api/ussd', json={'session_id': 'language-test', 'text': '2'})
    assert selected.status_code == 200
    assert 'Tamil' in selected.json()['response']


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
