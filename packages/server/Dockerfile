FROM node:14.16.0-buster-slim as node

RUN apt-get update && apt-get install -y \
  tini \
  && rm -rf /var/lib/apt/lists/*

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /app

COPY packages/server/package*.json ./
RUN npm ci

COPY packages/server .

ENTRYPOINT [ "tini", "--" ]
CMD ["node", "bin/www"]
