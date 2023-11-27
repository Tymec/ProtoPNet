from io import BufferedReader

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@pytest.fixture
def image() -> tuple[str, BufferedReader]:
    # 086_Pacific_Loon
    return ("test_image.jpg", open("tests/resources/test_image.jpg", "rb"))


def test_no_image_provided() -> None:
    response = client.post("/predict")
    assert response.status_code == 422

    json_response = response.json()
    assert json_response["detail"][0]["type"] == "missing"
    assert json_response["detail"][0]["loc"] == ["body", "image"]
    assert json_response["detail"][0]["msg"] == "Field required"


def test_invalid_image_type() -> None:
    response = client.post(
        "/predict",
        files={"image": ("test_image.pdf", open("tests/resources/test_image.pdf", "rb"))},
    )
    assert response.status_code == 400

    json_response = response.json()
    assert json_response["detail"] == "Only JPEG OR PNG images are allowed."


def test_invalid_k(mocker, image) -> None:
    response = client.post(
        "/predict",
        files={"image": image},
        data={
            "k": "-1",
        },
    )
    assert response.status_code == 422

    json_response = response.json()
    assert json_response["detail"][0]["type"] == "greater_than"
    assert json_response["detail"][0]["loc"] == ["body", "k"]


def test_predict(mocker, image) -> None:
    # Don't save images
    mocker.patch("PIL.Image.Image.save")

    response = client.post(
        "/predict",
        files={"image": image},
        data={},
    )
    assert response.status_code == 200

    json_response = response.json()
    assert json_response["prediction"] == "Pacific Loon"
    assert len(json_response["confidence"]) == 5
    assert len(json_response["heatmap_urls"]) == 10
    assert len(json_response["boxmap_urls"]) == 10
