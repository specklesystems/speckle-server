# NOTE: Docker context should be set to git root directory, to include the viewer
ARG NODE_ENV=production

FROM node:18.15.0-bullseye-slim as build-stage

ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

WORKDIR /speckle-server

# install wait
ARG WAIT_VERSION=2.8.0
ENV WAIT_VERSION=${WAIT_VERSION}
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/${WAIT_VERSION}/wait ./wait
RUN chmod +x ./wait

COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

# Only copy in the relevant package.json files for the dependencies
COPY packages/preview-service/package.json ./packages/preview-service/
COPY packages/viewer/package.json ./packages/viewer/
COPY packages/objectloader/package.json ./packages/objectloader/
COPY packages/shared/package.json ./packages/shared/

RUN yarn workspaces focus -A && yarn

# Onyl copy in the relevant source files for the dependencies
COPY packages/shared ./packages/shared/
COPY packages/objectloader ./packages/objectloader/
COPY packages/viewer ./packages/viewer/
COPY packages/preview-service ./packages/preview-service/

# This way the foreach only builds the frontend and its deps
RUN yarn workspaces foreach run build

FROM node:18.15.0-bullseye-slim as node

RUN apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y \
  --no-install-recommends \
  tini=0.19.0-1 \
  # chromium dependencies \
  ca-certificates=20210119 \
  fonts-liberation=1:1.07.4-11 \
  libasound2=1.2.4-1.1 \
  libatk-bridge2.0-0=2.38.0-1 \
  libatk1.0-0=2.36.0-2 \
  libatspi2.0-0=2.38.0-4 \
  libcairo2=1.16.0-5 \
  libcups2=2.3.3op2-3+deb11u2 \
  libdbus-1-3=1.12.24-0+deb11u1 \
  libdrm2=2.4.104-1 \
  libexpat1=2.2.10-2+deb11u5 \
  libgbm1=20.3.5-1 \
  libglib2.0-0=2.66.8-1 \
  libnspr4=2:4.29-1 \
  libnss3=2:3.61-1+deb11u2 \
  libpango-1.0-0=1.46.2-3 \
  libx11-6=2:1.7.2-1 \
  libxcb1=1.14-3 \
  libxcomposite1=1:0.4.5-1 \
  libxdamage1=1:1.1.5-2 \
  libxext6=2:1.3.3-1.1 \
  libxfixes3=1:5.0.3-2 \
  libxkbcommon0=1.0.3-2 \
  libxrandr2=2:1.5.1-1 \
  wget=1.21-1+deb11u1 \
  xdg-utils=1.1.3-4.1 \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build-stage /speckle-server/wait /wait

ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

WORKDIR /speckle-server
COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

# Onyl copy in the relevant package.json files for the dependencies
COPY packages/preview-service/package.json ./packages/preview-service/

WORKDIR /speckle-server/packages

COPY --from=build-stage /speckle-server/packages/shared ./shared
COPY --from=build-stage /speckle-server/packages/objectloader ./objectloader
COPY --from=build-stage /speckle-server/packages/viewer ./viewer
COPY --from=build-stage /speckle-server/packages/preview-service ./preview-service

WORKDIR /speckle-server/packages/preview-service
RUN yarn workspaces focus --production

ENTRYPOINT [ "tini", "--", "node", "bin/www" ]
