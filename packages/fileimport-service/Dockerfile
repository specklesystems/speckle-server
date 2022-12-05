FROM node:16.18.1-bullseye-slim as node

RUN apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y \
  --no-install-recommends \
  python3=3.9.2-3 \
  python3-pip=20.3.4-4+deb11u1 \
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

WORKDIR /speckle-server/packages/fileimport-service
COPY packages/fileimport-service/package.json ./
RUN yarn workspaces focus --production

COPY packages/fileimport-service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY packages/fileimport-service .

CMD ["yarn", "node", "src/daemon.js"]
