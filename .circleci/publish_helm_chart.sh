#!/bin/bash

set -e

git config --global user.email "devops+circleci@speckle.systems"
git config --global user.name "CI"

git clone git@github.com:specklesystems/helm.git ../helm
echo "test" > ../helm/test

cd ../helm
git add .
git commit -m "CircleCI commit"
git push
