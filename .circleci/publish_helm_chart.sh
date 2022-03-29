#!/bin/bash

set -e

RELEASE_VERSION=$(./.circleci/get_version.sh)

echo "Releasing Helm Chart version $RELEASE_VERSION"

git config --global user.email "devops+circleci@speckle.systems"
git config --global user.name "CI"

git clone git@github.com:specklesystems/helm.git ~/helm
rm -rf ~/helm/charts/speckle-server
cp -r utils/helm/speckle-server ~/helm/charts/speckle-server

echo 'version: '$RELEASE_VERSION >> ~/helm/charts/speckle-server/Chart.yaml
echo 'appVersion: "'$RELEASE_VERSION'"' >> ~/helm/charts/speckle-server/Chart.yaml

sed -i 's/docker_image_tag: [^\s]*/docker_image_tag: '$RELEASE_VERSION'/g' ~/helm/charts/speckle-server/values.yaml

cd ~/helm

git add .
git commit -m "CircleCI commit"
git push
