# NOTE: Docker context should be set to git root directory, to include the viewer
ARG NODE_ENV=production

FROM node:18-bookworm-slim@sha256:408f8cbbb7b33a5bb94bdb8862795a94d2b64c2d516856824fd86c4a5594a443 AS build-stage

ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

WORKDIR /speckle-server

# install wait
ARG WAIT_VERSION=2.8.0
ENV WAIT_VERSION=${WAIT_VERSION}
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/${WAIT_VERSION}/wait ./wait
RUN chmod +x ./wait

COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

# Only copy in the relevant package.json files for the dependencies
COPY packages/frontend-2/type-augmentations/stubs ./packages/frontend-2/type-augmentations/stubs/
COPY packages/preview-service/package.json ./packages/preview-service/
COPY packages/viewer/package.json ./packages/viewer/
COPY packages/objectloader/package.json ./packages/objectloader/
COPY packages/shared/package.json ./packages/shared/

RUN yarn workspaces focus -A && yarn

# Onyl copy in the relevant source files for the dependencies
COPY packages/shared ./packages/shared/
COPY packages/objectloader ./packages/objectloader/
COPY packages/viewer ./packages/viewer/
COPY packages/preview-service ./packages/preview-service/

# This way the foreach only builds the frontend and its deps
RUN yarn workspaces foreach -W run build

# google-chrome-stable is only available for amd64 so we have to fix the platform
# hadolint ignore=DL3029
FROM --platform=linux/amd64 node:18-bookworm-slim@sha256:408f8cbbb7b33a5bb94bdb8862795a94d2b64c2d516856824fd86c4a5594a443 AS node

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
# Install tini and fonts
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
    --no-install-recommends \
    # up to date ca-certs are required for downloading the google signing key
    ca-certificates=20230311 \
    tini=0.19.0-1 \
    fonts-ipafont-gothic=00303-23 \
    fonts-wqy-zenhei=0.9.45-8 \
    fonts-thai-tlwg=1:0.7.3-1 \
    fonts-kacst=2.01+mry-15 \
    fonts-freefont-ttf=20120503-10 \
    libxss1=1:1.2.3-1 && \
    # Clean up
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
# hadolint ignore=DL3015
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
    # --no-install-recommends # This is causing issues with the google-chrome-stable install as not all gpg components are installed if recommended installs are disabled
    gnupg=2.2.40-1.1 && \
    # Clean up
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build-stage /speckle-server/wait /wait

ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

WORKDIR /speckle-server
COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

# Only copy in the relevant package.json files for the dependencies
COPY packages/frontend-2/type-augmentations/stubs ./packages/frontend-2/type-augmentations/stubs/
COPY packages/preview-service/package.json ./packages/preview-service/

WORKDIR /speckle-server/packages

COPY --from=build-stage /speckle-server/packages/shared ./shared
COPY --from=build-stage /speckle-server/packages/objectloader ./objectloader
COPY --from=build-stage /speckle-server/packages/viewer ./viewer
COPY --from=build-stage /speckle-server/packages/preview-service ./preview-service

WORKDIR /speckle-server/packages/preview-service

RUN yarn workspaces focus --production

RUN groupadd -g 30000 -r pptruser && \
    useradd -r -g pptruser -G audio,video -u 800 pptruser && \
    mkdir -p /home/pptruser/Downloads && \
    chown -R pptruser:pptruser /home/pptruser && \
    chown -R pptruser:pptruser ./node_modules && \
    chown -R pptruser:pptruser ./package.json

# overriding this value via `--build-arg CACHE_BUST=$(date +%s)` will cause the latest google chrome to be fetched
ARG CACHE_BUST=1

# install google chrome
# hadolint ignore=DL3008
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
    --no-install-recommends \
    # wget has different versions for different architectures so we cannot pin version
    wget && \
    wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg && \
    sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] https://dl-ssl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
    # remove wget after use
    DEBIAN_FRONTEND=noninteractive apt-get remove -y \
    wget && \
    # update packages in order to use google chrome repo
    apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
    --no-install-recommends \
    google-chrome-stable && \
    # Clean up
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Run everything after as non-privileged user.
USER pptruser

ENTRYPOINT [ "tini", "--", "node", "--loader=./dist/src/aliasLoader.js", "bin/www.js" ]
