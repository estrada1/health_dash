from backend.app_factory import create_app


def test_factory_registers_pages_and_health_routes():
    app = create_app()
    client = app.test_client()

    assert client.get("/").status_code == 200
    assert client.get("/api/health").status_code == 200
