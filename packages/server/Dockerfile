FROM node:18.12.1-bullseye-slim as build-stage
ARG NODE_ENV=production
ARG SPECKLE_SERVER_VERSION=custom

RUN apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y \
  --no-install-recommends \
  tini=0.19.0-1 \
  fonts-dejavu-core=2.37-2 \
  fontconfig=2.13.1-4.2 \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /speckle-server

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

FROM node:18.12.1-bullseye-slim as production-stage
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ARG SPECKLE_SERVER_VERSION=custom

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.8.0/wait /wait
RUN chmod +x /wait

WORKDIR /speckle-server

COPY --from=build-stage /speckle-server/.yarnrc.yml .
COPY --from=build-stage /speckle-server/.yarn ./.yarn
COPY --from=build-stage /speckle-server/package.json /speckle-server/yarn.lock ./
COPY --from=build-stage /speckle-server/node_modules ./node_modules
COPY --from=build-stage /speckle-server/packages/shared /speckle-server/packages/shared
COPY --from=build-stage /speckle-server/packages/objectloader /speckle-server/packages/objectloader

WORKDIR /speckle-server/packages/server

COPY --from=build-stage /speckle-server/packages/server/dist ./dist
COPY --from=build-stage /speckle-server/packages/server/assets ./assets
COPY --from=build-stage /speckle-server/packages/server/bin ./bin

ENV FILE_SIZE_LIMIT_MB=100
ENV SPECKLE_SERVER_VERSION=${SPECKLE_SERVER_VERSION}
CMD ["yarn", "node", "bin/www"]
