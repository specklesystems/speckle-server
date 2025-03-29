FROM node:18-bookworm-slim@sha256:3197eb4d1d37f37cc2217dc1a5c01f5d61d840e6299185e72e66fd2a6a698127 AS build-stage
ARG NODE_ENV=production
ARG SPECKLE_SERVER_VERSION=custom
ARG BUILD_SOURCEMAPS=false

# for better sourcemaps (the app still gets minified at the end)
ENV SKIP_LIBRARY_MINIFICATION=true

WORKDIR /speckle-server

COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./
COPY utils/ensure-tailwind-deps.mjs ./utils/

COPY packages/viewer/package.json ./packages/viewer/
COPY packages/objectloader/package.json ./packages/objectloader/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui-components/package.json ./packages/ui-components/
COPY packages/ui-components-nuxt/package.json ./packages/ui-components-nuxt/
COPY packages/tailwind-theme/package.json ./packages/tailwind-theme/
COPY packages/frontend-2/package.json ./packages/frontend-2/
COPY packages/frontend-2/type-augmentations ./packages/frontend-2/ 

COPY packages/objectloader ./packages/objectloader/
COPY packages/viewer ./packages/viewer/
COPY packages/shared ./packages/shared/
COPY packages/ui-components ./packages/ui-components/
COPY packages/ui-components-nuxt ./packages/ui-components-nuxt/
COPY packages/tailwind-theme ./packages/tailwind-theme/
COPY packages/frontend-2 ./packages/frontend-2/

# hadolint ignore=DL3059
RUN yarn workspaces focus -A
# hadolint ignore=DL3059
RUN yarn workspaces foreach -W run build

ENV TINI_VERSION v0.19.0
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

FROM gcr.io/distroless/nodejs18-debian12:nonroot@sha256:95865babdc6c8b0de14bcec0ab9ad2617ce6a0d793c63d3f6cedae25a0651951 AS production-stage
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
