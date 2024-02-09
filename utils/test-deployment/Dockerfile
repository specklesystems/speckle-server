FROM debian:12-slim@sha256:7802002798b0e351323ed2357ae6dc5a8c4d0a05a57e7f4d8f97136151d3d603 AS build-stage
WORKDIR /venv
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install \
    --no-install-suggests --no-install-recommends --yes \
    python3-venv=3.11.2-1+b1 && \
    python3 -m venv /venv

COPY utils/test-deployment/requirements.txt /requirements.txt
RUN /venv/bin/pip install --disable-pip-version-check --requirement /requirements.txt

FROM gcr.io/distroless/python3-debian12:nonroot@sha256:02c3a74bee78c927ab39dd739f0e56e36675e6adc9032208abb7ed8b83067c74 as production-stage
ARG SPECKLE_SERVER
ARG SPECKLE_VERSION
ENV SPECKLE_SERVER=${SPECKLE_SERVER} \
    SPECKLE_SERVER=${SPECKLE_VERSION}
COPY --from=build-stage /venv /venv
COPY utils/test-deployment /app
WORKDIR /app
ENTRYPOINT [ "/venv/bin/python3", "-u", "./run_tests.py" ]
