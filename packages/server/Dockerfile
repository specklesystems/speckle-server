FROM node:16.13-bullseye-slim as node
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ARG SPECKLE_SERVER_VERSION=custom

RUN apt-get update && apt-get install -y \
  tini \
  fonts-dejavu-core fontconfig \
  && rm -rf /var/lib/apt/lists/*

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.8.0/wait /wait
RUN chmod +x /wait

WORKDIR /app

COPY package.json yarn.lock ./
RUN corepack enable && yarn plugin import workspace-tools

COPY packages/server/package.json ./packages/server/
WORKDIR /app/packages/server
RUN yarn workspaces focus --production

COPY packages/server .

ENV SPECKLE_SERVER_VERSION=${SPECKLE_SERVER_VERSION}
CMD ["yarn", "node", "bin/www"]
