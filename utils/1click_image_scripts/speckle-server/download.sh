#!/bin/bash

echo "Getting latest version of SpeckleServer Setup files..."

mkdir -p /opt/speckle-server
cd /opt/speckle-server

wget https://raw.githubusercontent.com/specklesystems/speckle-server/main/utils/1click_image_scripts/setup.py
wget https://raw.githubusercontent.com/specklesystems/speckle-server/main/utils/1click_image_scripts/template-nginx-site.conf
wget https://raw.githubusercontent.com/specklesystems/speckle-server/main/utils/1click_image_scripts/template-docker-compose.yml
