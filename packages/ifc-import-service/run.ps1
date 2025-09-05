$ErrorActionPreference = "Stop";
Set-Location $PSScriptRoot
uv sync --frozen --no-dev 
uv run main.py
