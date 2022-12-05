FROM node:16.18.0-bullseye-slim as build-stage

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /speckle-server

COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

COPY packages/webhook-service/package.json ./packages/webhook-service/
COPY packages/shared/package.json ./packages/shared/

RUN yarn workspaces focus -A && yarn

COPY packages/shared ./packages/shared/
COPY packages/webhook-service/src ./packages/webhook-service/

RUN yarn workspaces foreach run build

FROM node:16.18.0-bullseye-slim as node

RUN apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y \
  --no-install-recommends \
  tini=0.19.0-1 \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.8.0/wait /wait
RUN chmod +x /wait

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /speckle-server

COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

COPY packages/webhook-service/package.json ./packages/webhook-service/

COPY --from=build-stage /speckle-server/packages/shared ./packages/shared
COPY --from=build-stage /speckle-server/packages/webhook-service ./packages/webhook-service

WORKDIR /speckle-server/packages/webhook-service/
RUN yarn workspaces focus --production

ENTRYPOINT [ "tini", "--" ]
CMD ["yarn", "node", "main.js"]
