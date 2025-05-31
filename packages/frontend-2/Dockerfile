FROM node:22-bookworm-slim@sha256:2f3571619daafc6b53232ebf2fcc0817c1e64795e92de317c1684a915d13f1a5 AS build-stage
ARG NODE_ENV=production
ARG BUILD_SOURCEMAPS=false

# for better sourcemaps (the app still gets minified at the end)
ENV SKIP_LIBRARY_MINIFICATION=true

WORKDIR /speckle-server

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
COPY packages/frontend-2/type-augmentations ./packages/frontend-2/

COPY packages/objectloader2 ./packages/objectloader2/
COPY packages/viewer ./packages/viewer/
COPY packages/shared ./packages/shared/
COPY packages/ui-components ./packages/ui-components/
COPY packages/ui-components-nuxt ./packages/ui-components-nuxt/
COPY packages/tailwind-theme ./packages/tailwind-theme/
COPY packages/frontend-2 ./packages/frontend-2/

# hadolint ignore=DL3059
RUN PUPPETEER_SKIP_DOWNLOAD=true PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 yarn workspaces focus -A
# hadolint ignore=DL3059
RUN yarn workspaces foreach --exclude "@speckle/frontend-2" -W run build

# improve caching as other builds do not depend on server version
ARG SPECKLE_SERVER_VERSION=custom
# hadolint ignore=DL3059
RUN yarn workspaces foreach --include "packages/frontend-2" -W run build


ENV TINI_VERSION=v0.19.0
RUN apt-get update -y \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y \
     --no-install-recommends \
     ca-certificates=20230311 \
     curl=7.88.1-10+deb12u12 \
    && curl -fsSL https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini -o /tini \
    && chmod +x /tini \
    && apt-get remove -y curl \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

FROM gcr.io/distroless/nodejs22-debian12:nonroot@sha256:581893ba58980f0b4c7444d7a16b89f4e966cd89a89f3e0c6f26c482e312f008 AS production-stage
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY --link --from=build-stage /tini /tini

ENTRYPOINT ["/tini", "--"]

USER nonroot

ENV PORT=8080

ENV NUXT_PUBLIC_MIXPANEL_TOKEN_ID=acd87c5a50b56df91a795e999812a3a4
ENV NUXT_PUBLIC_MIXPANEL_API_HOST=https://analytics.speckle.systems

WORKDIR /speckle-server
COPY --link --from=build-stage  /speckle-server/packages/frontend-2/.output .

EXPOSE ${PORT}

CMD ["/nodejs/bin/node", "./server/index.mjs"]
