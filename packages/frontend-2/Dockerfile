FROM node:16.18.0-bullseye-slim as build-stage
ARG NODE_ENV=production
ARG SPECKLE_SERVER_VERSION=custom

WORKDIR /speckle-server

COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

COPY packages/shared/package.json ./packages/shared/
COPY packages/frontend-2/package.json ./packages/frontend-2/
COPY packages/frontend-2/type-augmentations ./packages/frontend-2/ 

COPY packages/shared ./packages/shared/
COPY packages/frontend-2 ./packages/frontend-2/

RUN yarn workspaces focus -A
RUN yarn workspaces foreach run build

FROM node:16.18.0-bullseye-slim as production-stage
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

ENV TINI_VERSION v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

USER node

ENV PORT=8081
ENV API_ORIGIN=http://hyperion:3000
ENV MIXPANEL_TOKEN_ID=acd87c5a50b56df91a795e999812a3a4
ENV MIXPANEL_API_HOST=https://analytics.speckle.systems

ENV NUXT_PUBLIC_API_ORIGIN=${API_ORIGIN}
ENV NUXT_PUBLIC_MIXPANEL_TOKEN_ID=${MIXPANEL_TOKEN_ID}
ENV NUXT_PUBLIC_MIXPANEL_API_HOST=${MIXPANEL_API_HOST}


WORKDIR /speckle-server
COPY --from=build-stage  /speckle-server/packages/frontend-2/.output .

EXPOSE ${PORT}

CMD ["node", "./server/index.mjs"]