from pathlib import Path


def test_openapi_file_exists():
    assert Path("docs/api/openapi.yaml").exists()
