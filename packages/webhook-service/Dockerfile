FROM node:16.15-bullseye-slim as node

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

WORKDIR /speckle-server/packages/webhook-service
COPY packages/webhook-service/package.json .
RUN yarn workspaces focus --production

COPY packages/webhook-service/src .

CMD ["yarn", "node", "main.js"]
