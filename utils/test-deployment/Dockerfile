FROM debian:12-slim@sha256:98f4b71de414932439ac6ac690d7060df1f27161073c5036a7553723881bffbe AS build-stage
WORKDIR /venv
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install \
    --no-install-suggests --no-install-recommends --yes \
    python3-venv=3.11.2-1+b1 && \
    python3 -m venv /venv

COPY utils/test-deployment/requirements.txt /requirements.txt
RUN /venv/bin/pip install --disable-pip-version-check --requirement /requirements.txt

FROM gcr.io/distroless/python3-debian12:nonroot@sha256:3aa5d1eb6e9f83a4ed806174bb40296e04758ab95f53b61f976d3df2b57ca289 AS production-stage

COPY --from=build-stage /venv /venv
COPY utils/test-deployment /app
WORKDIR /app
ENTRYPOINT [ "/venv/bin/python3", "-u", "./run_tests.py" ]
