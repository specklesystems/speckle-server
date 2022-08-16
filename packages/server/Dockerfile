ARG NODE_ENV=production
ARG SPECKLE_SERVER_VERSION=custom
ARG FILE_SIZE_LIMIT_MB=100
ARG NODE_ENV=production

FROM node:16.15-bullseye-slim as build-stage

WORKDIR /speckle-server

# install wait
ENV WAIT_VERSION 2.8.0
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/${WAIT_VERSION}/wait ./wait
RUN chmod +x ./wait

# install tini
ENV TINI_VERSION v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini ./tini
RUN chmod +x ./tini

# install node packages
COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

WORKDIR /speckle-server/packages/server
COPY packages/server/package.json .
RUN yarn workspaces focus

COPY packages/server .

RUN yarn build && yarn workspaces focus --production

FROM gcr.io/distroless/nodejs:16 as production-stage

ENV FILE_SIZE_LIMIT_MB=${FILE_SIZE_LIMIT_MB}, \
    NODE_ENV=${NODE_ENV}, \
    SPECKLE_SERVER_VERSION=${SPECKLE_SERVER_VERSION}

WORKDIR /speckle-server
COPY --from=build-stage /speckle-server/wait /wait
COPY --from=build-stage /speckle-server/tini /tini
COPY --from=build-stage /speckle-server/node_modules ./node_modules

WORKDIR /speckle-server/packages/server
COPY --from=build-stage /speckle-server/packages/server/dist ./dist
COPY --from=build-stage /speckle-server/packages/server/assets ./assets
COPY --from=build-stage /speckle-server/packages/server/bin ./bin

ENTRYPOINT ["/tini", "--", "/nodejs/bin/node", "./bin/www"]
