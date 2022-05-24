#!/bin/bash

export PG_CONNECTION_STRING=postgres://speckle:speckle@localhost/speckle
cd src && python3 -u run.py
