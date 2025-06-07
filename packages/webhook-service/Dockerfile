ARG NODE_ENV=production

FROM node:22-bookworm-slim@sha256:2f3571619daafc6b53232ebf2fcc0817c1e64795e92de317c1684a915d13f1a5 AS build-stage

ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

WORKDIR /speckle-server

COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

COPY packages/frontend-2/type-augmentations/stubs ./packages/frontend-2/type-augmentations/stubs/
COPY packages/webhook-service/package.json ./packages/webhook-service/
COPY packages/shared/package.json ./packages/shared/

RUN PUPPETEER_SKIP_DOWNLOAD=true PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 yarn workspaces focus --all

COPY packages/shared ./packages/shared/
COPY packages/webhook-service/src ./packages/webhook-service/

RUN yarn workspaces foreach -W run build

ARG WAIT_VERSION=2.8.0
ENV WAIT_VERSION=${WAIT_VERSION}
ARG TINI_VERSION=v0.19.0
ENV TINI_VERSION=${TINI_VERSION}
RUN apt-get update -y \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y \
     --no-install-recommends \
     ca-certificates=20230311 \
     curl=7.88.1-10+deb12u12 \
    && curl -fsSL https://github.com/ufoscout/docker-compose-wait/releases/download/${WAIT_VERSION}/wait -o ./wait \
    && chmod +x ./wait \
    && curl -fsSL https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini -o ./tini \
    && chmod +x ./tini \
    && apt-get remove -y curl \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

FROM node:22-bookworm-slim@sha256:2f3571619daafc6b53232ebf2fcc0817c1e64795e92de317c1684a915d13f1a5 AS dependency-stage
# yarn install
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

WORKDIR /speckle-server

COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

COPY packages/frontend-2/type-augmentations/stubs ./packages/frontend-2/type-augmentations/stubs/
COPY packages/webhook-service/package.json ./packages/webhook-service/
COPY packages/shared/package.json ./packages/shared/

WORKDIR /speckle-server/packages/webhook-service
RUN PUPPETEER_SKIP_DOWNLOAD=true PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 yarn workspaces focus --production

FROM gcr.io/distroless/nodejs22-debian12:nonroot@sha256:581893ba58980f0b4c7444d7a16b89f4e966cd89a89f3e0c6f26c482e312f008 AS production-stage
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

WORKDIR /speckle-server/packages/webhook-service/
COPY packages/webhook-service/src .
COPY --link --from=build-stage /speckle-server/wait /usr/bin/wait
COPY --link --from=build-stage /speckle-server/tini /usr/bin/tini
COPY --link --from=build-stage /speckle-server/packages/shared ./packages/shared
COPY --link --from=build-stage /speckle-server/packages/webhook-service ./packages/webhook-service
COPY --link --from=dependency-stage /speckle-server/node_modules ./node_modules

ENTRYPOINT [ "tini", "--", "/nodejs/bin/node", "main.js"]
