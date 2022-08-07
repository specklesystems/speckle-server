FROM debian:11-slim AS build-stage

WORKDIR /build
# Add Tini
ENV TINI_VERSION v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini ./tini
RUN chmod +x ./tini

# Add python virtual env
WORKDIR /venv
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install \
    --no-install-suggests --no-install-recommends --yes \
    python3-venv=3.9.2-3 && \
    python3 -m venv /venv

COPY utils/monitor-deployment/requirements.txt /requirements.txt
RUN /venv/bin/pip install --disable-pip-version-check --requirement /requirements.txt

FROM gcr.io/distroless/python3-debian11 as production-stage

ARG PG_CONNECTION_STRING
ARG NODE_EXTRA_CA_CERTS
ENV PG_CONNECTION_STRING=${PG_CONNECTION_STRING}
ENV NODE_EXTRA_CA_CERTS=${NODE_EXTRA_CA_CERTS}

COPY --from=build-stage /venv /venv
WORKDIR /app
COPY --from=build-stage /build/tini ./tini
COPY utils/monitor-deployment .

ENTRYPOINT [ "./tini", "--", "/venv/bin/python3", "-u", "src/run.py"]
