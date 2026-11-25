from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_transform_rejects_short_text():
    response = client.post("/api/transform", json={
        "text": "too short",
        "output_type": "summary",
        "detail_level": "medium"
    })
    assert response.status_code == 400

def test_transform_rejects_invalid_output():
    response = client.post("/api/transform", json={
        "text": "This is a sufficiently long sample sentence for a validation test.",
        "output_type": "unknown",
        "detail_level": "medium"
    })
    assert response.status_code == 400

def test_upload_rejects_unsupported_file():
    response = client.post("/api/upload", files={
        "file": ("notes.docx", b"dummy content", "application/octet-stream")
    })
    assert response.status_code == 400
