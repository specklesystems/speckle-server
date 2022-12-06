FROM node:18.12.1-bullseye-slim as build-stage

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /speckle-server

COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

COPY packages/fileimport-service/package.json ./packages/fileimport-service/
COPY packages/shared/package.json ./packages/shared/

RUN yarn workspaces focus -A && yarn

COPY packages/shared ./packages/shared/
COPY packages/fileimport-service ./packages/fileimport-service/

RUN yarn workspaces foreach run build

FROM node:18.12.1-bullseye-slim as node

RUN apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y \
  --no-install-recommends \
  python3=3.9.2-3 \
  python3-pip=20.3.4-4+deb11u1 \
  tini=0.19.0-1 \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

COPY packages/fileimport-service/requirements.txt /speckle-server/
RUN pip install --no-cache-dir -r /speckle-server/requirements.txt

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.8.0/wait /wait
RUN chmod +x /wait

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /speckle-server

COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

COPY packages/fileimport-service/package.json ./packages/fileimport-service/

COPY --from=build-stage /speckle-server/packages/shared ./packages/shared
COPY --from=build-stage /speckle-server/packages/fileimport-service ./packages/fileimport-service

WORKDIR /speckle-server/packages/fileimport-service
RUN yarn workspaces focus --production

ENTRYPOINT [ "tini", "--" ]
CMD ["node", "--no-experimental-fetch", "src/daemon.js"]
