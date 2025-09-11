ARG NODE_ENV=production

FROM node:22-bookworm-slim@sha256:221ee67425de7a3c11ce4e81e63e50caaec82ede3a7d34599ab20e59d29a0cb5 AS build-stage

WORKDIR /speckle-server

# install tini
ARG TINI_VERSION=v0.19.0
RUN apt-get update -y \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y \
  --no-install-recommends \
  ca-certificates=20230311+deb12u1 \
  curl=7.88.1-10+deb12u14 \
  && curl -fsSL https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini -o /usr/bin/tini \
  && chmod +x /usr/bin/tini \
  && apt-get remove -y curl \
  && apt-get autoremove -y \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./
COPY utils/ensure-tailwind-deps.mjs ./utils/

COPY packages/viewer/package.json ./packages/viewer/
COPY packages/objectloader2/package.json ./packages/objectloader2/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui-components/package.json ./packages/ui-components/
COPY packages/ui-components-nuxt/package.json ./packages/ui-components-nuxt/
COPY packages/tailwind-theme/package.json ./packages/tailwind-theme/
COPY packages/frontend-2/package.json ./packages/frontend-2/
COPY packages/frontend-2/type-augmentations ./packages/frontend-2/type-augmentations

# consume the ARG from the global scope
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

# hadolint ignore=DL3059
RUN PUPPETEER_SKIP_DOWNLOAD=true PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 yarn workspaces focus -A

COPY packages/objectloader2 ./packages/objectloader2/
COPY packages/viewer ./packages/viewer/
COPY packages/shared ./packages/shared/
COPY packages/ui-components ./packages/ui-components/
COPY packages/ui-components-nuxt ./packages/ui-components-nuxt/
COPY packages/tailwind-theme ./packages/tailwind-theme/

# hadolint ignore=DL3059
RUN yarn workspaces foreach --exclude "@speckle/frontend-2" -W run build

COPY packages/frontend-2/type-augmentations ./packages/frontend-2
COPY packages/frontend-2 ./packages/frontend-2/

ARG BUILD_SOURCEMAPS=false
ENV BUILD_SOURCEMAPS=${BUILD_SOURCEMAPS}
# for better sourcemaps (the app still gets minified at the end)
ENV SKIP_LIBRARY_MINIFICATION=true
ARG SPECKLE_SERVER_VERSION=custom
# for better hydration mismatch errors in prod (larger bundle size tho)
ENV HYDRATION_MISMATCH_REPORTING=false
# hadolint ignore=DL3059
RUN yarn workspaces foreach --include "packages/frontend-2" -W run build

FROM gcr.io/distroless/nodejs22-debian12:nonroot@sha256:ed26b3ab750110c51d9dbdfd6c697561dc40a01c296460c3494d47b550ef4126 AS production-stage
ENV PORT=8080

ENV NUXT_PUBLIC_MIXPANEL_TOKEN_ID=acd87c5a50b56df91a795e999812a3a4
ENV NUXT_PUBLIC_MIXPANEL_API_HOST=https://analytics.speckle.systems

WORKDIR /speckle-server
COPY --link --from=build-stage  /speckle-server/packages/frontend-2/.output .
COPY --link --from=build-stage  /usr/bin/tini /usr/bin/tini

EXPOSE ${PORT}

# consume the ARG from the global scope
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}
USER nonroot
ENTRYPOINT [ "tini",  "--", "/nodejs/bin/node", "./server/index.mjs" ]
