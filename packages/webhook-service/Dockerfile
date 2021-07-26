FROM node:14.16.0-buster-slim as node

RUN apt-get update && apt-get install -y \
  tini \
  && rm -rf /var/lib/apt/lists/*

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.8.0/wait /wait
RUN chmod +x /wait

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

COPY packages/webhook-service/package*.json ./
RUN npm ci

COPY packages/webhook-service/src .

ENTRYPOINT [ "tini", "--" ]
CMD ["node", "main.js"]
