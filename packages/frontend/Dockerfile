# NOTE: Docker context should be set to git root directory, to include the viewer

# build stage
FROM node:16.13-bullseye-slim as deps-build

WORKDIR /opt/objectloader
COPY packages/objectloader /opt/objectloader
RUN npm install
RUN npm run build
# this whole thing is required cause npm 6.* doesn't allow for pack output dir specification
RUN mkdir /packages
# invoke npm pack and move its result to the packages folder when done
RUN npm pack --pack-destination=/packages/

WORKDIR /opt/viewer
COPY packages/viewer/package*.json ./
# this installs objectloader from a tarball 
RUN npm i $(find /packages -type f -name "speckle*.tgz")
RUN npm install
COPY packages/viewer .
RUN npm run build
RUN npm pack --pack-destination=/packages/

FROM node:16.13-bullseye-slim as build-stage

WORKDIR /opt/frontend
COPY --from=deps-build /packages /packages
COPY packages/frontend/package*.json ./
# RUN npm install ../viewer
RUN npm i $(find /packages -type f -name "speckle*.tgz")
RUN npm ci
COPY packages/frontend .
RUN npm run build


# production stage
FROM openresty/openresty:1.19.9.1-bullseye as production-stage
COPY --from=build-stage /opt/frontend/dist /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY packages/frontend/nginx/nginx.conf /etc/nginx/conf.d
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
