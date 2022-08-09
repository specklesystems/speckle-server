ARG NODE_ENV=production

FROM node:16.15-bullseye-slim as build-stage

WORKDIR /speckle-server

# add wait
ENV WAIT_VERSION 2.8.0
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/${WAIT_VERSION}/wait ./wait
RUN chmod +x ./wait

# Add tini
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

# pip install
COPY packages/fileimport-service/requirements.txt /requirements.txt
RUN /venv/bin/pip install --disable-pip-version-check --requirement /requirements.txt

# yarn install
WORKDIR /speckle-server
ENV NODE_ENV=${NODE_ENV}
COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

WORKDIR /speckle-server/packages/fileimport-service
COPY packages/fileimport-service/package.json .
RUN yarn workspaces focus --production

FROM gcr.io/distroless/nodejs:16 as production-stage

WORKDIR /speckle-server/packages/fileimport-service
COPY packages/fileimport-service .
COPY --from=build-stage /speckle-server/wait /wait
COPY --from=build-stage /speckle-server/tini /tini
COPY --from=build-stage /venv /venv
COPY --from=build-stage /speckle-server/node_modules ./node_modules

# HACK
# the node script calls 'python3', which works when running locally.
# Force use of the python virtual environment in the image,
# as this has the pip requirements installed.
ENV python3="/venv/bin/python3"

ENTRYPOINT ["/tini", "--", "/nodejs/bin/node", "src/daemon.js"]
