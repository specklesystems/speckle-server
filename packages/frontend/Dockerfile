# NOTE: Docker context should be set to git root directory, to include the viewer
ARG NODE_ENV=production
ARG SPECKLE_SERVER_VERSION=custom
# build stage
FROM node:18-bullseye-slim@sha256:8cc7dcd5aa06715247f8f2f258332f188d4221e2685b1a0159e4e6c3382e4918 as build-stage
ARG NODE_ENV
ARG SPECKLE_SERVER_VERSION

ENV NODE_ENV=${NODE_ENV}

WORKDIR /speckle-server
COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

# Onyl copy in the relevant package.json files for the dependencies
COPY packages/frontend-2/type-augmentations/stubs ./packages/frontend-2/type-augmentations/stubs/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/viewer/package.json ./packages/viewer/
COPY packages/objectloader/package.json ./packages/objectloader/
COPY packages/shared/package.json ./packages/shared/

RUN yarn workspaces focus --all

# Onyl copy in the relevant source files for the dependencies
COPY packages/objectloader ./packages/objectloader/
COPY packages/viewer ./packages/viewer/
COPY packages/frontend ./packages/frontend/
COPY packages/shared ./packages/shared/

# This way the foreach only builds the frontend and its deps
RUN yarn workspaces foreach -W run build

RUN DEBIAN_FRONTEND=noninteractive \
    apt-get -q update && \
    apt-get install --no-install-recommends -y \
    gettext=0.21-4 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# production stage
FROM bitnami/openresty:1.21.4-3-debian-11-r3@sha256:456f29ba40fb4b5591ded0666c50c5026e3e0f97397440b9c5f2246813de9ec8 as production-stage
ARG NODE_ENV
ARG SPECKLE_SERVER_VERSION

ENV NODE_ENV=${NODE_ENV}
ENV FILE_SIZE_LIMIT_MB=100

COPY --from=build-stage /usr/bin/envsubst /usr/bin/envsubst

COPY --from=build-stage /speckle-server/packages/frontend/dist /app

COPY packages/frontend/nginx/ /opt/bitnami/openresty/nginx/

# prepare the environment
ENTRYPOINT ["/opt/bitnami/openresty/nginx/docker-entrypoint.sh"]

EXPOSE 8080
CMD ["/opt/bitnami/scripts/openresty/entrypoint.sh", "/opt/bitnami/scripts/openresty/run.sh"]
