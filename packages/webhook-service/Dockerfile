ARG NODE_ENV=production

FROM node:22-bookworm-slim@sha256:4a4884e8a44826194dff92ba316264f392056cbe243dcc9fd3551e71cea02b90 AS build-stage

WORKDIR /speckle-server

# Download tini
ARG TINI_VERSION=v0.19.0
RUN apt-get update -y \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y \
     --no-install-recommends \
     ca-certificates=20230311+deb12u1 \
     curl=7.88.1-10+deb12u14 \
    && curl -fsSL https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini -o /usr/bin/tini \
    && chmod +x /usr/bin/tini \
    && apt-get remove -y curl \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

COPY packages/frontend-2/type-augmentations/stubs ./packages/frontend-2/type-augmentations/stubs/
COPY packages/webhook-service/package.json ./packages/webhook-service/
COPY packages/shared/package.json ./packages/shared/

# Consume the NODE_ENV ARG from the global scope
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}
RUN PUPPETEER_SKIP_DOWNLOAD=true PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 yarn workspaces focus --all

COPY packages/shared ./packages/shared/
COPY packages/webhook-service/src ./packages/webhook-service/

RUN yarn workspaces foreach -W run build

FROM node:22-bookworm-slim@sha256:4a4884e8a44826194dff92ba316264f392056cbe243dcc9fd3551e71cea02b90 AS dependency-stage
# yarn install

WORKDIR /speckle-server

COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

COPY packages/frontend-2/type-augmentations/stubs ./packages/frontend-2/type-augmentations/stubs/
COPY packages/webhook-service/package.json ./packages/webhook-service/
COPY packages/shared/package.json ./packages/shared/

WORKDIR /speckle-server/packages/webhook-service

# Consume the NODE_ENV ARG from the global scope
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}
RUN PUPPETEER_SKIP_DOWNLOAD=true PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 yarn workspaces focus --production

FROM gcr.io/distroless/nodejs22-debian12:nonroot@sha256:82f784c7f478cf5129d5446f99b442bbc17ef8ab48fbea25c58e05b2859896f7 AS production-stage

WORKDIR /speckle-server/packages/webhook-service/
COPY packages/webhook-service/src .
COPY --link --from=build-stage /usr/bin/tini /usr/bin/tini
COPY --link --from=build-stage /speckle-server/packages/shared ./packages/shared
COPY --link --from=build-stage /speckle-server/packages/webhook-service ./packages/webhook-service
COPY --link --from=dependency-stage /speckle-server/node_modules ./node_modules

# Consume the NODE_ENV ARG from the global scope
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

ENTRYPOINT [ "tini", "--", "/nodejs/bin/node", "main.js" ]
