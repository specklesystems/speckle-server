FROM node:16.15-bullseye-slim as node
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ARG SPECKLE_SERVER_VERSION=custom

RUN apt-get update && apt-get install -y \
  tini \
  fonts-dejavu-core fontconfig \
  && rm -rf /var/lib/apt/lists/*

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.8.0/wait /wait
RUN chmod +x /wait

WORKDIR /speckle-server

COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

WORKDIR /speckle-server/packages/server
COPY packages/server/package.json .
RUN yarn workspaces focus --production

COPY packages/server .

ENV SPECKLE_SERVER_VERSION=${SPECKLE_SERVER_VERSION}
CMD ["yarn", "node", "bin/www"]
