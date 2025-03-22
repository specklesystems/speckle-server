ARG NODE_ENV=production
ARG SPECKLE_SERVER_VERSION=custom

FROM node:18-bookworm-slim@sha256:bb9c8f9233ec86c9d77ecfe50c3e2e8493831dfc573e5acba52fb8ae60f72631 AS build-stage
ARG NODE_ENV
ARG SPECKLE_SERVER_VERSION
WORKDIR /speckle-server

# install wait
ARG WAIT_VERSION=2.8.0
ENV WAIT_VERSION=${WAIT_VERSION}
# install tini
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

# install node packages
COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

COPY packages/frontend-2/type-augmentations/stubs ./packages/frontend-2/type-augmentations/stubs/
COPY packages/server/package.json ./packages/server/
COPY packages/shared/package.json ./packages/shared/
COPY packages/objectloader/package.json ./packages/objectloader/

RUN yarn workspaces focus --all

# build shared libraries
COPY packages/server ./packages/server/
COPY packages/shared ./packages/shared/
COPY packages/objectloader ./packages/objectloader/

RUN yarn workspaces foreach -W run build

# install only production dependencies
# we need a clean environment, free of build dependencies
FROM node:18-bookworm-slim@sha256:bb9c8f9233ec86c9d77ecfe50c3e2e8493831dfc573e5acba52fb8ae60f72631 AS dependency-stage
ARG NODE_ENV
ARG SPECKLE_SERVER_VERSION

WORKDIR /speckle-server
COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

COPY packages/frontend-2/type-augmentations/stubs ./packages/frontend-2/type-augmentations/stubs/
COPY packages/server/package.json ./packages/server/
COPY packages/shared/package.json ./packages/shared/
COPY packages/objectloader/package.json ./packages/objectloader/

WORKDIR /speckle-server/packages/server
RUN yarn workspaces focus --production

FROM gcr.io/distroless/nodejs18-debian12:nonroot@sha256:193487232033a854f1d6e8010ddcc15f1f6c203cf3c4f7c9ea3e60d22ffc9396 AS production-stage
ARG NODE_ENV
ARG SPECKLE_SERVER_VERSION

ENV NODE_ENV=${NODE_ENV} \
    SPECKLE_SERVER_VERSION=${SPECKLE_SERVER_VERSION}

COPY --link --from=build-stage /speckle-server/wait /wait
COPY --link --from=build-stage /speckle-server/tini /tini

WORKDIR /speckle-server
COPY --link --from=build-stage /speckle-server/package.json ./package.json
COPY --link --from=build-stage /speckle-server/packages/shared ./packages/shared
COPY --link --from=build-stage /speckle-server/packages/objectloader ./packages/objectloader
COPY --link --from=dependency-stage /speckle-server/node_modules ./node_modules

WORKDIR /speckle-server/packages/server
COPY --link --from=build-stage /speckle-server/packages/server/package.json ./package.json
COPY --link --from=build-stage /speckle-server/packages/server/dist ./dist
COPY --link --from=build-stage /speckle-server/packages/server/assets ./assets
COPY --link --from=build-stage /speckle-server/packages/server/bin ./bin
# Copy only if exists https://stackoverflow.com/questions/31528384/conditional-copy-add-in-dockerfile/46801962#46801962
COPY --link --from=dependency-stage /speckle-server/packages/server/node_module[s] ./node_modules

ENTRYPOINT ["/nodejs/bin/node"]
CMD ["bin/www"]
