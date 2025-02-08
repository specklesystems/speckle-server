ARG NODE_ENV=production

FROM node:18-bookworm-slim@sha256:29752c4f06579d48b504ee569dbe3625374d31f37da1c3b411455ec196f113be AS build-stage

ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

WORKDIR /speckle-server

COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

COPY packages/frontend-2/type-augmentations/stubs ./packages/frontend-2/type-augmentations/stubs/
COPY packages/webhook-service/package.json ./packages/webhook-service/
COPY packages/shared/package.json ./packages/shared/

RUN yarn workspaces focus --all

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
     curl=7.88.1-10+deb12u8 \
    && curl -fsSL https://github.com/ufoscout/docker-compose-wait/releases/download/${WAIT_VERSION}/wait -o ./wait \
    && chmod +x ./wait \
    && curl -fsSL https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini -o ./tini \
    && chmod +x ./tini \
    && apt-get remove -y curl \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

FROM node:18-bookworm-slim@sha256:29752c4f06579d48b504ee569dbe3625374d31f37da1c3b411455ec196f113be AS dependency-stage
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
RUN yarn workspaces focus --production

FROM gcr.io/distroless/nodejs18-debian12:nonroot@sha256:78f0ca90819d831f0ce3e3fb35d9bd878a0c618060e7a487a1ca486d65201c3b AS production-stage
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
