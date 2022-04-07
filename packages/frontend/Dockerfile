# NOTE: Docker context should be set to git root directory, to include the viewer

# build stage
FROM node:16.13-bullseye-slim as build-stage

WORKDIR /opt/viewer
COPY packages/viewer/package*.json ./
RUN npm install
COPY packages/objectloader /opt/objectloader
RUN npm install ../objectloader
COPY packages/viewer .
RUN npm run build

WORKDIR /opt/frontend
COPY packages/frontend/package*.json ./
RUN npm install ../viewer
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
