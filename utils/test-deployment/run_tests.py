#!/usr/bin/env python3

# Script-style deployment testing: any error should fail the test and have non-zero exit code.

import os
import sys
import requests
from specklepy.api.client import SpeckleClient
from specklepy.api.models import ServerInfo


# Setting the SPECKLE_SERVER to test on
SPECKLE_SERVER = ""

if len(sys.argv) > 1:
    SPECKLE_SERVER = sys.argv[1]
if not SPECKLE_SERVER:
    SPECKLE_SERVER = os.getenv("SPECKLE_SERVER", "")
if not SPECKLE_SERVER:
    print(
        "❌ Error: No Speckle server specified. Use SPECKLE_SERVER environment variable or pass it as the first command-line argument"
    )
    exit(1)

VERIFY_CERTIFICATE = (
    True if os.getenv("VERIFY_CERTIFICATE", "1") != "0" else False
)  # default to True except in very narrow case where value is explicitly "0"

if not SPECKLE_SERVER.startswith("http://") and not SPECKLE_SERVER.startswith(
    "https://"
):
    SPECKLE_SERVER = "http://" + SPECKLE_SERVER

print(f"ℹ️ Using Speckle server '{SPECKLE_SERVER}'")

# Test that the server backend is accessible
client = SpeckleClient(
    SPECKLE_SERVER,
    use_ssl=SPECKLE_SERVER.startswith("https://"),
    verify_certificate=VERIFY_CERTIFICATE,
)
server_info = client.server.get()
assert isinstance(server_info, ServerInfo), "❌ GraphQL ServerInfo query error"
print(f"✅ GraphQL operation succeeded. Server name: {server_info.name}")

# Test if frontend is accessible
frontend_response = requests.get(SPECKLE_SERVER, verify=VERIFY_CERTIFICATE)
assert (
    frontend_response.status_code == 200
), f"❌ Frontend did not return a 200 status code, instead returned status code is {frontend_response.status_code}."
print("✅ Frontend accessible")

# Test that the deployed server version matches the expected version
SERVER_VERSION = ""
if len(sys.argv) > 2:
    SERVER_VERSION = sys.argv[2]
if not SERVER_VERSION:
    SERVER_VERSION = os.getenv("SERVER_VERSION")
if SERVER_VERSION:
    if not SERVER_VERSION == "latest":
        assert server_info.version.startswith(
            SERVER_VERSION
        ), f"❌ The deployed version {server_info.version} should match, or be prefixed by, the expected {SERVER_VERSION}"
        print(f"✅ Server version {SERVER_VERSION} is deployed and available")
    else:
        print("🟡 Not testing server version, as it was set to 'latest'")
else:
    print(
        "🟡 Not testing server version, as an expected value was not provided via environment variables or command-line argument"
    )

print("✅ Deployment tests PASS ✅")
