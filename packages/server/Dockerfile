ARG NODE_ENV=production

FROM node:22-bookworm-slim@sha256:221ee67425de7a3c11ce4e81e63e50caaec82ede3a7d34599ab20e59d29a0cb5 AS build-stage

WORKDIR /speckle-server

# install tini
ARG TINI_VERSION=v0.19.0
RUN apt-get update -y \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y \
     --no-install-recommends \
     ca-certificates=20230311+deb12u120230311 \
     curl=7.88.1-10+deb12u14 \
    && curl -fsSL https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini -o /usr/bin/tini \
    && chmod +x /usr/bin/tini \
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

# Consume the ARG from the global scope
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}
RUN PUPPETEER_SKIP_DOWNLOAD=true PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 yarn workspaces focus --all

# build shared libraries
COPY packages/server ./packages/server/
COPY packages/shared ./packages/shared/
COPY packages/objectloader ./packages/objectloader/

RUN yarn workspaces foreach -W run build

# install only production dependencies
# we need a clean environment, free of build dependencies
FROM node:22-bookworm-slim@sha256:221ee67425de7a3c11ce4e81e63e50caaec82ede3a7d34599ab20e59d29a0cb5 AS dependency-stage

WORKDIR /speckle-server
COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

COPY packages/frontend-2/type-augmentations/stubs ./packages/frontend-2/type-augmentations/stubs/
COPY packages/server/package.json ./packages/server/
COPY packages/shared/package.json ./packages/shared/
COPY packages/objectloader/package.json ./packages/objectloader/

WORKDIR /speckle-server/packages/server

# Consume the ARG from the global scope
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}
RUN PUPPETEER_SKIP_DOWNLOAD=true PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 yarn workspaces focus --production

FROM gcr.io/distroless/nodejs22-debian12@sha256:8d8b9363b0c9d1153f845824f9b754fdb050ada4fa190583eca2da13fdd3138c AS production-stage

COPY --link --from=build-stage /usr/bin/tini /usr/bin/tini

WORKDIR /speckle-server
COPY --link --from=build-stage /speckle-server/package.json ./package.json
COPY --link --from=build-stage /speckle-server/packages/shared ./packages/shared
COPY --link --from=build-stage /speckle-server/packages/objectloader ./packages/objectloader
COPY --link --from=dependency-stage /speckle-server/node_modules ./node_modules

WORKDIR /speckle-server/packages/server
COPY --link --from=build-stage /speckle-server/packages/server/package.json ./package.json
COPY --link --from=build-stage /speckle-server/packages/server/esmLoader.js ./esmLoader.js
COPY --link --from=build-stage /speckle-server/packages/server/root.js ./root.js
COPY --link --from=build-stage /speckle-server/packages/server/dist ./dist
COPY --link --from=build-stage /speckle-server/packages/server/assets ./assets
COPY --link --from=build-stage /speckle-server/packages/server/bin ./bin
# Copy only if exists https://stackoverflow.com/questions/31528384/conditional-copy-add-in-dockerfile/46801962#46801962
COPY --link --from=dependency-stage /speckle-server/packages/server/node_module[s] ./node_modules

# Only for docker compose version, optimized for caching
ARG SPECKLE_SERVER_VERSION=custom
# Consume the NODE_ENV ARG from the global scope
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV} \
  SPECKLE_SERVER_VERSION=${SPECKLE_SERVER_VERSION}

ENTRYPOINT [ "tini", "--", "/nodejs/bin/node", "--import=./esmLoader.js", "./bin/www" ]
