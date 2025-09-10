ARG NODE_ENV=production

# NOTE: Docker context should be set to git root directory, to include the viewer
FROM node:18-bookworm-slim@sha256:408f8cbbb7b33a5bb94bdb8862795a94d2b64c2d516856824fd86c4a5594a443 AS build-stage

# Consume the ARG from the global scope
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

WORKDIR /speckle-server

COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

# Only copy in the relevant package.json files for the dependencies
COPY packages/frontend-2/type-augmentations/stubs ./packages/frontend-2/type-augmentations/stubs/
COPY packages/preview-frontend/package.json ./packages/preview-frontend/
COPY packages/preview-service/package.json ./packages/preview-service/
COPY packages/viewer/package.json ./packages/viewer/
COPY packages/objectloader2/package.json ./packages/objectloader2/
COPY packages/shared/package.json ./packages/shared/

RUN PUPPETEER_SKIP_DOWNLOAD=true PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 yarn workspaces focus -A

# Only copy in the relevant source files for the dependencies
COPY packages/shared ./packages/shared/
COPY packages/objectloader2 ./packages/objectloader2/
COPY packages/viewer ./packages/viewer/
COPY packages/preview-frontend ./packages/preview-frontend/
COPY packages/preview-service ./packages/preview-service/

# This way the foreach only builds the frontend and its deps
RUN yarn workspaces foreach -W run build

# google-chrome-stable is only available for amd64 so we have to fix the platform
# hadolint ignore=DL3029
FROM --platform=linux/amd64 node:22-bookworm-slim@sha256:221ee67425de7a3c11ce4e81e63e50caaec82ede3a7d34599ab20e59d29a0cb5 AS node

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
# Install tini, and fonts
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
    --no-install-recommends \
    # up to date ca-certs are required for downloading the google signing key
    ca-certificates=20230311+deb12u1 \
    tini=0.19.0-1+b3 \
    fonts-ipafont-gothic=00303-23 \
    fonts-wqy-zenhei=0.9.45-8 \
    fonts-thai-tlwg=1:0.7.3-1 \
    fonts-kacst=2.01+mry-15 \
    fonts-freefont-ttf=20120503-10 \
    libxss1=1:1.2.3-1 \
    # libegl1 & libxext6 are required for hardware accelarated rendering to work
    libegl1=1.6.0-1 \
    libxext6=2:1.3.4-1+b1 && \
    # Clean up
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
# hadolint ignore=DL3015
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
    # --no-install-recommends # This is causing issues with the google-chrome-stable install as not all gpg components are installed if recommended installs are disabled
    gnupg=2.2.40-1.1+deb12u1 && \
    # Clean up
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Consume the ARG from the global scope
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

WORKDIR /speckle-server
COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

# Only copy in the relevant package.json files for the dependencies
COPY packages/preview-service/package.json ./packages/preview-service/

WORKDIR /speckle-server/packages

COPY --link --from=build-stage /speckle-server/packages/shared ./shared
COPY --link --from=build-stage /speckle-server/packages/preview-service ./preview-service
COPY --link --from=build-stage /speckle-server/packages/preview-frontend/dist ./preview-service/public

WORKDIR /speckle-server/packages/preview-service

RUN PUPPETEER_SKIP_DOWNLOAD=true PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 yarn workspaces focus --production

RUN groupadd -g 30000 -r pptruser && \
    useradd -r -g pptruser -G audio,video -u 800 pptruser && \
    mkdir -p /home/pptruser/Downloads && \
    chown -R pptruser:pptruser /home/pptruser && \
    if [ -d ./node_modules ]; then chown -R pptruser:pptruser ./node_modules; else true; fi && \
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

ENV CHROMIUM_EXECUTABLE_PATH="/usr/bin/google-chrome"
ENV USER_DATA_DIR='/tmp/puppeteer'

# Run everything after as non-privileged user.
USER pptruser
ENTRYPOINT [ "tini", "--", "node", "--loader=./dist/bootstrap.js", "./dist/main.js" ]
