ARG NODE_ENV=production

FROM node:18.15.0-bullseye-slim as build-stage

ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

WORKDIR /speckle-server

# install tini
ARG TINI_VERSION=v0.19.0
ENV TINI_VERSION=${TINI_VERSION}
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini ./tini
RUN chmod +x ./tini

# install wait
ARG WAIT_VERSION=2.8.0
ENV WAIT_VERSION=${WAIT_VERSION}
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/${WAIT_VERSION}/wait ./wait
RUN chmod +x ./wait

# download yarn dependencies for building shared libraries
COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/fileimport-service/package.json ./packages/fileimport-service/

RUN yarn workspaces focus --all

# build shared libraries
COPY packages/shared ./packages/shared/
COPY packages/fileimport-service ./packages/fileimport-service/
RUN yarn workspaces foreach run build

# Install python virtual env and python dependencies
RUN apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y \
  --no-install-recommends \
  python3-venv=3.9.2-3 \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* \
  && python3 -m venv /venv

COPY packages/fileimport-service/requirements.txt /speckle-server/
RUN /venv/bin/pip install --disable-pip-version-check --no-cache-dir --requirement /speckle-server/requirements.txt

FROM node:18.15.0-bullseye-slim as dependency-stage
# installing just the production dependencies
# separate stage to avoid including development dependencies
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

WORKDIR /speckle-server
COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/fileimport-service/package.json ./packages/fileimport-service/
WORKDIR /speckle-server/packages/fileimport-service
RUN yarn workspaces focus --production

FROM gcr.io/distroless/python3-debian11:nonroot as python-image

FROM gcr.io/distroless/nodejs:18 as distributable-stage

ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}
ARG NODE_BINARY_PATH=/nodejs/bin/node
ENV NODE_BINARY_PATH=${NODE_BINARY_PATH}
ARG PYTHON_BINARY_PATH=/venv/bin/python3
ENV PYTHON_BINARY_PATH=${PYTHON_BINARY_PATH}

WORKDIR /speckle-server

COPY --from=python-image / /
COPY --from=build-stage /speckle-server/tini /usr/bin/tini
COPY --from=build-stage /speckle-server/wait /usr/bin/wait
COPY --from=build-stage /speckle-server/packages/shared ./packages/shared
COPY --from=build-stage /speckle-server/packages/fileimport-service ./packages/fileimport-service
COPY --from=build-stage /venv /venv
COPY --from=dependency-stage /speckle-server/node_modules ./node_modules

WORKDIR /speckle-server/packages/fileimport-service

# Prefixing PATH with our virtual environment should seek required binaries
# from virtual environment first.
# Unsetting python home
ENV PATH=/venv/bin:${PATH} \
    PYTHONHOME=

ENTRYPOINT [ "tini", "--", "/nodejs/bin/node", "--no-experimental-fetch", "src/daemon.js"]
