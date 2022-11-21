

build:
	docker build -t preview-service ../.. -f Dockerfile

run:
	docker run -it --rm --net=host \
		-e PG_CONNECTION_STRING="postgres://speckle:speckle@localhost/speckle" \
		preview-service

run-release:
	docker run -it --rm --net=host \
		-e PG_CONNECTION_STRING="postgres://speckle:speckle@localhost/speckle" \
		speckle/speckle-preview-service:v2.3.3


small:
	docker build -t small-preview-service ../.. -f Dockerfile.small
	docker run -it --rm --net=host -e PG_CONNECTION_STRING="postgres://speckle:speckle@localhost/speckle" small-preview-service bash
