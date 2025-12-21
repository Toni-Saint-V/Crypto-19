from fastapi.testclient import TestClient

import server


def test_dashboard_endpoint_returns_json():
    client = TestClient(server.app)
    r = client.get("/api/dashboard?symbol=BTCUSDT&timeframe=1h&mode=TEST")
    assert r.status_code == 200
    j = r.json()
    assert j is not None
