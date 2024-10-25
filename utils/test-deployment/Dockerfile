FROM debian:12-slim@sha256:36e591f228bb9b99348f584e83f16e012c33ba5cad44ef5981a1d7c0a93eca22 AS build-stage
WORKDIR /venv
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install \
    --no-install-suggests --no-install-recommends --yes \
    python3-venv=3.11.2-1+b1 && \
    python3 -m venv /venv

COPY utils/test-deployment/requirements.txt /requirements.txt
RUN /venv/bin/pip install --disable-pip-version-check --requirement /requirements.txt

FROM gcr.io/distroless/python3-debian12:nonroot@sha256:e575731d90afa06f113d94beedb526f56c9a7cb38612c608ff211bb8efc09572 as production-stage
ARG SPECKLE_SERVER
ARG SPECKLE_VERSION
ENV SPECKLE_SERVER=${SPECKLE_SERVER} \
    SPECKLE_SERVER=${SPECKLE_VERSION}
COPY --from=build-stage /venv /venv
COPY utils/test-deployment /app
WORKDIR /app
ENTRYPOINT [ "/venv/bin/python3", "-u", "./run_tests.py" ]
