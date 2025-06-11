#!/bin/bash

echo $TEST_ENV

if [[ "$TEST_ENV" == refs/tags/* ]] 
then 
  echo "true"
fi
