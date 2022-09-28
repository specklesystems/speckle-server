# NOTE: Docker context should be set to git root directory, to include the viewer

# build stage
FROM node:16.15-bullseye-slim as build-stage
ARG SPECKLE_SERVER_VERSION=custom


WORKDIR /speckle-server
COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

# Onyl copy in the relevant package.json files for the dependencies
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/viewer/package.json ./packages/viewer/
COPY packages/objectloader/package.json ./packages/objectloader/

RUN yarn workspaces focus -A

# Onyl copy in the relevant source files for the dependencies
COPY packages/objectloader ./packages/objectloader/
COPY packages/viewer ./packages/viewer/
COPY packages/frontend ./packages/frontend/

# This way the foreach only builds the frontend and its deps
RUN yarn workspaces foreach -pt run build

# production stage
FROM openresty/openresty:1.21.4.1-bullseye as production-stage

COPY --from=build-stage /speckle-server/packages/frontend/dist /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf

COPY packages/frontend/nginx/ /etc/nginx/

RUN apt-get update && \
    apt-get install -y dos2unix && \
    apt-get clean && \
    dos2unix /etc/nginx/docker-entrypoint.sh

# prepare the environment
ENTRYPOINT ["/etc/nginx/docker-entrypoint.sh"]

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
