"""
Configuration module for the IFC Importer.

This module uses typed-settings to load configuration from environment variables
and .env files, providing type safety and validation.
"""

import typed_settings as ts
from dotenv import load_dotenv

# Load .env file first to make environment variables available
_ = load_dotenv()


@ts.settings
class Settings:
    """Application settings loaded from environment variables."""

    fileimport_queue_postgres_url: ts.SecretStr = ts.SecretStr()
    """PostgreSQL connection URL for the file import queue database."""


# Load settings with no prefix for environment variables
# This maintains compatibility with the previous Dynaconf configuration
settings = ts.load(
    cls=Settings,
    appname="",  # Empty appname to avoid automatic prefix generation
    config_files=[],  # No config files, only environment variables
    env_prefix="",  # Explicitly set empty prefix for environment variables
)
