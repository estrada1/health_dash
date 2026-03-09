from app import app


def test_weights_rejects_non_json_payload():
    client = app.test_client()
    response = client.post(
        "/api/weights",
        data="not-json",
        content_type="text/plain",
    )

    assert response.status_code == 400
    assert response.get_json() == {"error": "Request must be valid JSON"}


def test_meals_rejects_non_json_payload():
    client = app.test_client()
    response = client.post(
        "/api/meals",
        data="not-json",
        content_type="text/plain",
    )

    assert response.status_code == 400
    assert response.get_json() == {"error": "Request must be valid JSON"}
