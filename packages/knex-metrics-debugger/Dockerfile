# NOTE: Docker context should be set to git root directory, to include the shared package
ARG NODE_ENV=production

FROM node:18-bookworm-slim@sha256:408f8cbbb7b33a5bb94bdb8862795a94d2b64c2d516856824fd86c4a5594a443 as build-stage

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
COPY packages/knex-metrics-debugger/package.json ./packages/knex-metrics-debugger/
COPY packages/shared/package.json ./packages/shared/

RUN yarn workspaces focus -A && yarn

# Only copy in the relevant source files for the dependencies
COPY packages/shared ./packages/shared/
COPY packages/knex-metrics-debugger ./packages/knex-metrics-debugger/

# This way the foreach only builds the frontend and its deps
RUN yarn workspaces foreach -W run build

FROM node:18-bookworm-slim@sha256:408f8cbbb7b33a5bb94bdb8862795a94d2b64c2d516856824fd86c4a5594a443 as node

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
# hadolint ignore=DL3008,DL3015
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
    --no-install-recommends \
    tini=0.19.0-1 && \
    # Clean up
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build-stage /speckle-server/wait /wait

ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

WORKDIR /speckle-server
COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

# Only copy in the relevant package.json files for the dependencies
COPY packages/knex-metrics-debugger/package.json ./packages/knex-metrics-debugger/

WORKDIR /speckle-server/packages

COPY --from=build-stage /speckle-server/packages/shared ./shared
COPY --from=build-stage /speckle-server/packages/knex-metrics-debugger ./knex-metrics-debugger

WORKDIR /speckle-server/packages/knex-metrics-debugger

RUN yarn workspaces focus --production

ENTRYPOINT [ "tini", "--", "node", "bin/www" ]
