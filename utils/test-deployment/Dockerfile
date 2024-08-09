FROM debian:12-slim@sha256:5f7d5664eae4a192c2d2d6cb67fc3f3c7891a8722cd2903cc35aa649a12b0c8d AS build-stage
WORKDIR /venv
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install \
    --no-install-suggests --no-install-recommends --yes \
    python3-venv=3.11.2-1+b1 && \
    python3 -m venv /venv

COPY utils/test-deployment/requirements.txt /requirements.txt
RUN /venv/bin/pip install --disable-pip-version-check --requirement /requirements.txt

FROM gcr.io/distroless/python3-debian12:nonroot@sha256:fdb3a044d46989e59648dae450d09cd76560013c12947ee4102a416e39621fb9 as production-stage
ARG SPECKLE_SERVER
ARG SPECKLE_VERSION
ENV SPECKLE_SERVER=${SPECKLE_SERVER} \
    SPECKLE_SERVER=${SPECKLE_VERSION}
COPY --from=build-stage /venv /venv
COPY utils/test-deployment /app
WORKDIR /app
ENTRYPOINT [ "/venv/bin/python3", "-u", "./run_tests.py" ]
