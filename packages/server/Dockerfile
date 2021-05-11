FROM node:14.16.0-buster-slim as node

RUN apt-get update && apt-get install -y \
  tini \
  && rm -rf /var/lib/apt/lists/*

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.8.0/wait /wait
RUN chmod +x /wait

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

ARG SPECKLE_SERVER_VERSION=custom
ENV SPECKLE_SERVER_VERSION=${SPECKLE_SERVER_VERSION}
WORKDIR /app

COPY packages/server/package*.json ./
RUN npm ci

COPY packages/server .

ENTRYPOINT [ "tini", "--" ]
CMD ["node", "bin/www"]
