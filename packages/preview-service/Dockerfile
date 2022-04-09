# NOTE: Docker context should be set to git root directory, to include the viewer


# build stage
FROM node:14.16-buster-slim as deps-build 

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/objectloader
COPY packages/objectloader/package*.json ./
RUN npm install --production=false
COPY packages/objectloader .
RUN npm run build
# this whole thing is required cause npm 6.* doesn't allow for pack output dir specification
RUN mkdir /packages
# invoke npm pack and move its result to the packages folder when done
RUN mv $(npm pack) /packages/

WORKDIR /opt/viewer
COPY packages/viewer/package*.json ./
# this installs objectloader from a tarball 
RUN npm i $(find /packages -type f -name "speckle*.tgz")
# Install dependencies and devDependencies
RUN npm install --production=false
COPY packages/viewer .
RUN npm run build
RUN mv $(npm pack) /packages/

FROM node:14.16-buster-slim as build-stage

WORKDIR /opt/preview-service
COPY --from=deps-build /packages /packages
COPY packages/preview-service/package*.json ./
# this installs viewer and objectloader from a tarball
RUN npm i $(find /packages -type f -name "speckle*.tgz")
RUN npm ci --production=false
COPY packages/preview-service .
RUN npm run build-fe

FROM node:14.16-buster-slim as node

RUN apt-get update && apt-get install -y \
  tini \
  && rm -rf /var/lib/apt/lists/*

# chromium dependencies
RUN apt-get update && apt-get install -y \
  ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils \
  && rm -rf /var/lib/apt/lists/*

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.8.0/wait /wait
RUN chmod +x /wait

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY --from=build-stage /opt/preview-service /opt/preview-service

WORKDIR /opt/preview-service

ENTRYPOINT [ "tini", "--" ]
CMD ["node", "bin/www"]
