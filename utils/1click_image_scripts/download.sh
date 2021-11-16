#!/bin/bash

echo "* Getting latest version of SpeckleServer Setup files..."

mkdir -p /opt/speckle-server
cd /opt/speckle-server

wget https://raw.githubusercontent.com/specklesystems/speckle-server/main/utils/1click_image_scripts/setup.py -O setup.py
wget https://raw.githubusercontent.com/specklesystems/speckle-server/main/utils/1click_image_scripts/template-nginx-site.conf -O template-nginx-site.conf
wget https://raw.githubusercontent.com/specklesystems/speckle-server/main/utils/1click_image_scripts/template-docker-compose.yml -O template-docker-compose.yml

docker image rm {speckle/speckle-preview-service:2,speckle/speckle-webhook-service:2,speckle/speckle-server:2,speckle/speckle-frontend:2} || true
chmod +x setup.py

echo "* Getting the docker images for the latest SpeckleServer release..."
docker-compose -f template-docker-compose.yml pull
