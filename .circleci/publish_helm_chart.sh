#!/bin/bash

set -e

echo "$PWD"

# TODO: fix versioning
VERSION_CHART=0.1.1
VERSION_APP=2.3.3
VERSION_DOCKER_IMAGE=v2.3.3

git config --global user.email "devops+circleci@speckle.systems"
git config --global user.name "CI"

git clone git@github.com:specklesystems/helm.git ~/helm
rm -rf ~/helm/charts/speckle-server
cp -r utils/helm/speckle-server ~/helm/charts/speckle-server

echo 'version: '$VERSION_CHART >> ~/helm/charts/speckle-server/Chart.yaml
echo 'appVersion: "'$VERSION_APP'"' >> ~/helm/charts/speckle-server/Chart.yaml

sed -i 's/docker_image_tag: [^\s]*/docker_image_tag: '$VERSION_DOCKER_IMAGE'/g' ~/helm/charts/speckle-server/values.yaml

cd ~/helm

git add .
git commit -m "CircleCI commit"
git push
