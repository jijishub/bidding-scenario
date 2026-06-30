from fastapi.testclient import TestClient

from backend.main import app


def test_backend_routes_are_available():
    client = TestClient(app)

    home_response = client.get('/')
    assert home_response.status_code == 200

    bid_response = client.post('/bid', data={'bidder': 'Alice', 'amount': '150'})
    assert bid_response.status_code == 200
