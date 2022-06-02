# NOTE: Docker context should be set to git root directory, to include the viewer

# build stage
FROM node:16.15-bullseye-slim as build-stage

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
FROM openresty/openresty:1.19.9.1-bullseye as production-stage
COPY --from=build-stage /speckle-server/packages/frontend/dist /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY packages/frontend/nginx/nginx.conf /etc/nginx/conf.d
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
