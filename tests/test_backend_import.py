from fastapi.testclient import TestClient

from backend.app.state_machine import SessionData, process_step
from backend.main import app


def test_backend_routes_are_available():
    client = TestClient(app)

    home_response = client.get('/')
    assert home_response.status_code == 200

    bid_response = client.post('/bid', data={'bidder': 'Alice', 'amount': '150'})
    assert bid_response.status_code == 200


def test_alive_inputs_parse_as_expected():
    cases = [
        ("true", True),
        ("TRUE", True),
        ("false", False),
        ("FALSE", False),
        ("1", True),
        ("0", False),
        (" 1 ", True),
        (" 0 ", False),
    ]

    for raw_value, expected in cases:
        session = SessionData(id="test", state="ALIVE_INPUT")
        process_step(session, raw_value)
        assert session.alive is expected
