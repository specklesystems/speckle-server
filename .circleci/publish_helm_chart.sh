#!/bin/bash

set -e

RELEASE_VERSION=${IMAGE_VERSION_TAG}

echo "Releasing Helm Chart version $RELEASE_VERSION"

git config --global user.email "devops+circleci@speckle.systems"
git config --global user.name "CI"

git clone git@github.com:specklesystems/helm.git ~/helm

# before overwriting the chart with the build version, check if the current chart version
# is not newer than the currently build one

CURRENT_VERSION=(cat charts/speckle-server/Chart.yaml | grep ^version | grep -o '2\..*')
echo ${CURRENT_VERSION}

./check_version.py ${CURRENT_VERSION} ${RELEASE_VERSION}
if [ $? -eq 1 ] 
then 
  echo "The current helm chart version is newer than the currently built. Exiting" 
  exit 1
fi

rm -rf ~/helm/charts/speckle-server
cp -r utils/helm/speckle-server ~/helm/charts/speckle-server

echo 'version: '$RELEASE_VERSION >> ~/helm/charts/speckle-server/Chart.yaml
echo 'appVersion: "'$RELEASE_VERSION'"' >> ~/helm/charts/speckle-server/Chart.yaml

sed -i 's/docker_image_tag: [^\s]*/docker_image_tag: '$RELEASE_VERSION'/g' ~/helm/charts/speckle-server/values.yaml

cd ~/helm

git add .
git commit -m "CircleCI commit"
git push
