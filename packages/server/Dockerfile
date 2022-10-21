FROM node:16.15-bullseye-slim as build-stage

WORKDIR /speckle-server

# install wait
ARG WAIT_VERSION=2.8.0
ENV WAIT_VERSION=${WAIT_VERSION}
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/${WAIT_VERSION}/wait ./wait
RUN chmod +x ./wait

# install tini
ARG TINI_VERSION=v0.19.0
ENV TINI_VERSION=${TINI_VERSION}
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini ./tini
RUN chmod +x ./tini

# install node packages
COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

COPY packages/server/package.json ./packages/server/
COPY packages/shared/package.json ./packages/shared/
COPY packages/objectloader/package.json ./packages/objectloader/

RUN yarn workspaces focus -A

COPY packages/server ./packages/server/
COPY packages/shared ./packages/shared/
COPY packages/objectloader ./packages/objectloader/

RUN yarn workspaces foreach run build

WORKDIR /speckle-server/packages/server
RUN yarn workspaces focus --production

FROM gcr.io/distroless/nodejs:16 as production-stage
ARG NODE_ENV=production
ARG SPECKLE_SERVER_VERSION=custom
ARG FILE_SIZE_LIMIT_MB=100

ENV FILE_SIZE_LIMIT_MB=${FILE_SIZE_LIMIT_MB} \
    NODE_ENV=${NODE_ENV} \
    SPECKLE_SERVER_VERSION=${SPECKLE_SERVER_VERSION}

WORKDIR /speckle-server
COPY --from=build-stage /speckle-server/wait /wait
COPY --from=build-stage /speckle-server/tini /tini
COPY --from=build-stage /speckle-server/node_modules ./node_modules
COPY --from=build-stage /speckle-server/packages/shared /speckle-server/packages/shared
COPY --from=build-stage /speckle-server/packages/objectloader /speckle-server/packages/objectloader

WORKDIR /speckle-server/packages/server
COPY --from=build-stage /speckle-server/packages/server/dist ./dist
COPY --from=build-stage /speckle-server/packages/server/assets ./assets
COPY --from=build-stage /speckle-server/packages/server/bin ./bin

ENTRYPOINT ["/tini", "--", "/nodejs/bin/node", "./bin/www"]
