FROM node:14.16.0-buster-slim as node

RUN apt-get update && apt-get install -y \
  tini \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /app

COPY packages/server/package*.json ./
RUN npm ci

COPY packages/server .

ENTRYPOINT [ "tini", "--" ]
CMD ["node", "bin/www"]
