# NOTE: Docker context should be set to git root directory, to include the viewer

# build stage
FROM node:18.12.1-bullseye-slim as build-stage
ARG SPECKLE_SERVER_VERSION=custom
 

WORKDIR /speckle-server
COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

# Onyl copy in the relevant package.json files for the dependencies
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/viewer/package.json ./packages/viewer/
COPY packages/objectloader/package.json ./packages/objectloader/
COPY packages/shared/package.json ./packages/shared/

RUN yarn workspaces focus -A

# Onyl copy in the relevant source files for the dependencies
COPY packages/objectloader ./packages/objectloader/
COPY packages/viewer ./packages/viewer/
COPY packages/frontend ./packages/frontend/
COPY packages/shared ./packages/shared/

# This way the foreach only builds the frontend and its deps
RUN yarn workspaces foreach run build

# production stage


FROM openresty/openresty:1.21.4.1-4-jammy-amd64 as production-stage
ENV FILE_SIZE_LIMIT_MB=100
COPY --from=build-stage /speckle-server/packages/frontend/dist /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf

COPY packages/frontend/nginx/ /etc/nginx/

# prepare the environment
ENTRYPOINT ["/etc/nginx/docker-entrypoint.sh"]

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
