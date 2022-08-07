FROM node:16.15-bullseye-slim as build-stage

RUN apt-get update && apt-get install -y \
  tini \
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

FROM gcr.io/distroless/nodejs:16 as production-stage

WORKDIR /speckle-server/packages/webhook-service
COPY packages/webhook-service/src .

COPY --from=build-stage /wait /wait
COPY --from=build-stage /speckle-server/node_modules ./node_modules

CMD ["main.js"]
