ARG NODE_ENV=production

FROM node:16.15-bullseye-slim as build-stage

WORKDIR /speckle-server
RUN apt-get update && apt-get install -y \
  tini \
  && rm -rf /var/lib/apt/lists/*

ENV WAIT_VERSION 2.8.0
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/${WAIT_VERSION}/wait ./wait
RUN chmod +x ./wait

ENV TINI_VERSION v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini ./tini
RUN chmod +x ./tini

# yarn install
ENV NODE_ENV=${NODE_ENV}

COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

WORKDIR /speckle-server/packages/webhook-service
COPY packages/webhook-service/package.json .
RUN yarn workspaces focus --production

FROM gcr.io/distroless/nodejs:16 as production-stage

WORKDIR /speckle-server/packages/webhook-service
COPY packages/webhook-service/src .
COPY --from=build-stage /speckle-server/wait /wait
COPY --from=build-stage /speckle-server/tini /tini
COPY --from=build-stage /speckle-server/node_modules ./node_modules

ENTRYPOINT ["/tini", "--", "/nodejs/bin/node", "main.js"]
