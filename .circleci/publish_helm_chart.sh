#!/bin/bash

set -e

git clone git@github.com:specklesystems/helm.git ../helm
echo "test" > ../helm/test

cd ../helm
git add .
git commit -m "CircleCI commit"
git push
