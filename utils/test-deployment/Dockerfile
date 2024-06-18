FROM debian:12-slim@sha256:67f3931ad8cb1967beec602d8c0506af1e37e8d73c2a0b38b181ec5d8560d395 AS build-stage
WORKDIR /venv
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install \
    --no-install-suggests --no-install-recommends --yes \
    python3-venv=3.11.2-1+b1 && \
    python3 -m venv /venv

COPY utils/test-deployment/requirements.txt /requirements.txt
RUN /venv/bin/pip install --disable-pip-version-check --requirement /requirements.txt

FROM gcr.io/distroless/python3-debian12:nonroot@sha256:14c62b8925d3bb30319de2f346bde203fe18103a68898284a62db9d4aa54c794 as production-stage
ARG SPECKLE_SERVER
ARG SPECKLE_VERSION
ENV SPECKLE_SERVER=${SPECKLE_SERVER} \
    SPECKLE_SERVER=${SPECKLE_VERSION}
COPY --from=build-stage /venv /venv
COPY utils/test-deployment /app
WORKDIR /app
ENTRYPOINT [ "/venv/bin/python3", "-u", "./run_tests.py" ]
