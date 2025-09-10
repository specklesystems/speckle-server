#!/bin/sh
cd "$(dirname "$0")" || exit 1
uv sync --frozen --no-dev 
uv run main.py
