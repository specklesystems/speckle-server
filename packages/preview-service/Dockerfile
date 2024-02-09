# NOTE: Docker context should be set to git root directory, to include the viewer
ARG NODE_ENV=production

FROM node:18-bookworm-slim@sha256:27c468a7089b35374ec79b2a49ae9911818e37665caffe4d4d531b74c78cfbe3 as build-stage

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
COPY packages/frontend-2/type-augmentations/stubs ./packages/frontend-2/type-augmentations/stubs/
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

FROM node:18-bookworm-slim@sha256:27c468a7089b35374ec79b2a49ae9911818e37665caffe4d4d531b74c78cfbe3 as node

RUN apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y \
  --no-install-recommends \
  tini=0.19.0-1 \
  # chromium dependencies \
  ca-certificates=20230311 \
  fonts-liberation=1:1.07.4-11 \
  libasound2=1.2.8-1+b1 \
  libatk-bridge2.0-0=2.46.0-5 \
  libatk1.0-0=2.46.0-5 \
  libatspi2.0-0=2.46.0-5 \
  libcairo2=1.16.0-7 \
  libcups2=2.4.2-3+deb12u5 \
  libdbus-1-3=1.14.10-1~deb12u1 \
  libdrm2=2.4.114-1+b1 \
  libexpat1=2.5.0-1 \
  libgbm1=22.3.6-1+deb12u1 \
  libglib2.0-0=2.74.6-2 \
  libnspr4=2:4.35-1 \
  libnss3=2:3.87.1-1 \
  libpango-1.0-0=1.50.12+ds-1 \
  libx11-6=2:1.8.4-2+deb12u2 \
  libxcb1=1.15-1 \
  libxcomposite1=1:0.4.5-1 \
  libxdamage1=1:1.1.6-1 \
  libxext6=2:1.3.4-1+b1 \
  libxfixes3=1:6.0.0-2 \
  libxkbcommon0=1.5.0-1 \
  libxrandr2=2:1.5.2-2+b1 \
  wget=1.21.3-1+b2 \
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
COPY packages/frontend-2/type-augmentations/stubs ./packages/frontend-2/type-augmentations/stubs/
COPY packages/preview-service/package.json ./packages/preview-service/

WORKDIR /speckle-server/packages

COPY --from=build-stage /speckle-server/packages/shared ./shared
COPY --from=build-stage /speckle-server/packages/objectloader ./objectloader
COPY --from=build-stage /speckle-server/packages/viewer ./viewer
COPY --from=build-stage /speckle-server/packages/preview-service ./preview-service

WORKDIR /speckle-server/packages/preview-service
RUN yarn workspaces focus --production

ENTRYPOINT [ "tini", "--", "node", "bin/www" ]
