# NOTE: Docker context must be the git root directory, to include the shared directory
ARG NODE_ENV=production

FROM node:18-bookworm-slim@sha256:39095e997ff4399e1b07c147ccb432f47bd9e67c639d5fdf41af4a796c50ecf7 AS build-stage

WORKDIR /speckle-server

# Download tini
ARG TINI_VERSION=v0.19.0
ENV TINI_VERSION=${TINI_VERSION}
RUN apt-get update -y \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y \
     --no-install-recommends \
     ca-certificates=20230311 \
     curl=7.88.1-10+deb12u12 \
    && curl -fsSL https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini -o ./tini \
    && chmod +x ./tini \
    && apt-get remove -y curl \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

WORKDIR /speckle-server

COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

# Only copy in the relevant package.json files for the dependencies
COPY packages/shared/package.json ./packages/shared/
COPY packages/monitor-deployment/package.json ./packages/monitor-deployment/

RUN yarn workspaces focus -A && yarn install

# Only copy in the relevant source files for the dependencies
COPY packages/shared ./packages/shared/
COPY packages/monitor-deployment ./packages/monitor-deployment/

RUN yarn workspaces foreach -W run build

WORKDIR /speckle-server/packages/monitor-deployment
RUN yarn workspaces focus --production

FROM gcr.io/distroless/nodejs18-debian12:nonroot@sha256:7df895865e4c4b781dbac947aca8298a0ae1db441bd671aeb4c6791081e0a8a7 AS production-stage

ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

WORKDIR /speckle-server
COPY --link --from=build-stage /speckle-server/tini /usr/bin/tini
COPY --link --from=build-stage /speckle-server/packages/shared ./packages/shared
COPY --link --from=build-stage /speckle-server/packages/monitor-deployment ./packages/monitor-deployment
COPY --link --from=build-stage /speckle-server/node_modules ./node_modules

WORKDIR /speckle-server/packages/monitor-deployment

ENTRYPOINT [ "tini", "--", "/nodejs/bin/node", "--loader=./dist/src/aliasLoader.js", "bin/www.js" ]
