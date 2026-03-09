from backend.storage.json_repository import JsonRepository


def test_append_persists_item(tmp_path):
    path = tmp_path / "weights.json"
    repo = JsonRepository(path)

    repo.append({"weight": 150})

    assert repo.read_all() == [{"weight": 150}]
