#!/bin/bash

set -e

echo "$PWD"

git config --global user.email "devops+circleci@speckle.systems"
git config --global user.name "CI"

git clone git@github.com:specklesystems/helm.git ~/helm
echo "test" > ~/helm/test

cd ~/helm
echo $PWD
ls -lha ~/.ssh

git add .
git commit -m "CircleCI commit"
git push
