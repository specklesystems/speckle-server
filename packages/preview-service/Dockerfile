# NOTE: Docker context should be set to git root directory, to include the viewer


# build stage
FROM node:16.15-buster-slim as build-stage

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}


WORKDIR /speckle-server
COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

# Onyl copy in the relevant package.json files for the dependencies
COPY packages/preview-service/package.json ./packages/preview-service/
COPY packages/viewer/package.json ./packages/viewer/
COPY packages/objectloader/package.json ./packages/objectloader/

RUN yarn workspaces focus -A
RUN yarn 

# Onyl copy in the relevant source files for the dependencies
COPY packages/objectloader ./packages/objectloader/
COPY packages/viewer ./packages/viewer/
COPY packages/preview-service ./packages/preview-service/

# This way the foreach only builds the frontend and its deps
RUN yarn workspaces foreach -pt run build



FROM node:16.15-bullseye-slim as node

RUN apt-get update && apt-get install -y \
  tini \
  && rm -rf /var/lib/apt/lists/*

# chromium dependencies
RUN apt-get update && apt-get install -y \
  # ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils \
  ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libatspi2.0-0 libcairo2 libcups2 libdbus-1-3 libdrm2 libexpat1 libgbm1 libglib2.0-0 libnspr4 libnss3 libpango-1.0-0 libx11-6 libxcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxkbcommon0 libxrandr2 wget xdg-utils \
  && rm -rf /var/lib/apt/lists/*

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.8.0/wait /wait
RUN chmod +x /wait

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /speckle-server
COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

# Onyl copy in the relevant package.json files for the dependencies
COPY packages/preview-service/package.json ./packages/preview-service/

WORKDIR /speckle-server/packages

COPY --from=build-stage /speckle-server/packages/objectloader ./objectloader
COPY --from=build-stage /speckle-server/packages/viewer ./viewer
COPY --from=build-stage /speckle-server/packages/preview-service ./preview-service

WORKDIR /speckle-server/packages/preview-service
RUN yarn workspaces focus --production

ENTRYPOINT [ "tini", "--" ]
CMD ["yarn", "node", "bin/www"]
