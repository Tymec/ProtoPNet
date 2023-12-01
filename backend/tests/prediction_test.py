from io import BufferedReader, BytesIO
import random
import pytest
from fastapi.testclient import TestClient
from app.main import app
from net.inference import predict,load_model
from PIL import Image
from app import MODEL_INFO_PATH, MODEL_PATH
import os

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
def test_invalid_k(image) -> None:
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
	mocker.patch("app.main.get_transfer_manager")
	mocker.patch("s3transfer.manager.TransferManager.upload")
	mocker.patch("s3transfer.manager.TransferManager.shutdown")

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
def test_predict_random()->None:
	disregard = False
	if disregard:
		return
	k=10
	min_success_rate = 0.8
	#assert False
	model = load_model(MODEL_PATH, MODEL_INFO_PATH)
	path = "tests/resources/examples"
	flist = os.listdir(path)
	if k>len(flist):k=len(flist)
	correct = 0
	testlist = random.sample(flist,k)
	for test in testlist:
		image_data = Image.open(path+"/"+test)
		pred = predict(model, image_data)[0]
		pred += 1
		if pred == (int)(test[:3]): correct+=1
		if pred != (int)(test[:3]): print("expected:",test[:3]," got:",pred) #for testing purposes
	assert correct/k >= min_success_rate
def test_image_wrong_format(mocker)->None:
	mocker.patch("app.main.get_transfer_manager")
	mocker.patch("s3transfer.manager.TransferManager.upload")
	mocker.patch("s3transfer.manager.TransferManager.shutdown")
	response = client.post(
		"/predict",
		files={"image": open("tests/resources/edgecases/wrongformat.jpg", "rb")}
	)
	assert response.status_code == 400
def test_image_onepixel(mocker)->None:
	mocker.patch("app.main.get_transfer_manager")
	mocker.patch("s3transfer.manager.TransferManager.upload")
	mocker.patch("s3transfer.manager.TransferManager.shutdown")
	response = client.post(
		"/predict",
		files={"image": ("singlepixel.jpg", open("tests/resources/edgecases/singlepixel.jpg", "rb"))}
	)
	assert response.status_code == 200
def test_image_transparent(mocker)->None:
	mocker.patch("app.main.get_transfer_manager")
	mocker.patch("s3transfer.manager.TransferManager.upload")
	mocker.patch("s3transfer.manager.TransferManager.shutdown")
	response = client.post(
		"/predict",
		files={"image": ("alpha.png", open("tests/resources/edgecases/alpha.png", "rb"))}
	)
	assert response.status_code == 200
