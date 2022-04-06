FROM node:16.13-bullseye-slim as node

RUN apt-get update && apt-get install -y \
  python3 \
  python3-pip \
  tini \
  && rm -rf /var/lib/apt/lists/*

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.8.0/wait /wait
RUN chmod +x /wait

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

COPY packages/fileimport-service/package*.json ./
RUN npm ci

COPY packages/fileimport-service/requirements.txt ./
RUN pip install -r requirements.txt

COPY packages/fileimport-service .

CMD ["node", "src/daemon.js"]
