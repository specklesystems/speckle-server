#!/usr/bin/env python3

# Script-style deployment testing: any error should fail the test and have non-zero exit code.

import os
import sys
import requests
import urllib.parse
from specklepy.api.client import SpeckleClient
from specklepy.api.models import ServerInfo


# Setting the SPECKLE_SERVER to test on
SPECKLE_SERVER = ''
if len(sys.argv) > 1:
    SPECKLE_SERVER = sys.argv[1]
if not SPECKLE_SERVER:
    SPECKLE_SERVER = os.getenv('SPECKLE_SERVER', '')
if not SPECKLE_SERVER:
    print("Error: No Speckle server specified. Use SPECKLE_SERVER environment variable or pass it as the first command-line argument")
    exit(1)

if not SPECKLE_SERVER.startswith('http://') and not SPECKLE_SERVER.startswith('https://'):
    SPECKLE_SERVER = 'http://' + SPECKLE_SERVER

print(f"Using Speckle server '{SPECKLE_SERVER}'")

# Test if frontend is accessible
frontend_response = requests.get(urllib.parse.urljoin(SPECKLE_SERVER, 'img/logo.ddce2456.svg'))
assert frontend_response.status_code == 200, "Frontend request doesn't return status code 200"
assert frontend_response.headers.get('Content-Type', '').startswith('image/'), 'Frontend logo Content-Type is not an image'
print("Frontend accessible")

# Test if backend is accessible
graphql_accept_header = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
backend_response = requests.get(urllib.parse.urljoin(SPECKLE_SERVER, 'graphql'), headers={'Accept': graphql_accept_header})
assert backend_response.status_code == 200, "Backend request doesn't return status code 200"
assert 'GraphQL Playground' in backend_response.text, "/graphql didn't respond with GraphQL Playground"
print("Backend accessible")

# Test basic unauthenticated operation using specklepy
client = SpeckleClient(SPECKLE_SERVER, use_ssl=SPECKLE_SERVER.startswith('https://'))
server_info = client.server.get()
assert isinstance(server_info, ServerInfo), "GraphQL ServerInfo query error"
print(f"GraphQL operation succeeded. Server name: {server_info.name}")

print('Deployment tests PASS')
