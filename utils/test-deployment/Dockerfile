FROM debian:12-slim@sha256:12c396bd585df7ec21d5679bb6a83d4878bc4415ce926c9e5ea6426d23c60bdc AS build-stage
WORKDIR /venv
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install \
    --no-install-suggests --no-install-recommends --yes \
    python3-venv=3.11.2-1+b1 && \
    python3 -m venv /venv

COPY utils/test-deployment/requirements.txt /requirements.txt
RUN /venv/bin/pip install --disable-pip-version-check --requirement /requirements.txt

FROM gcr.io/distroless/python3-debian12:nonroot@sha256:66f3e24fd4906156a7360d2861731d31d3457a02f34fd3c4491f0b710a259988 AS production-stage
ARG SPECKLE_SERVER
ARG SPECKLE_VERSION
ENV SPECKLE_SERVER=${SPECKLE_SERVER} \
    SPECKLE_SERVER=${SPECKLE_VERSION}
COPY --from=build-stage /venv /venv
COPY utils/test-deployment /app
WORKDIR /app
ENTRYPOINT [ "/venv/bin/python3", "-u", "./run_tests.py" ]
