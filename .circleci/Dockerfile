FROM node:14.16.0-buster-slim as node

FROM node as build
# Having multiple steps in builder doesn't increase the final image size
# So having verbose steps for readability and caching should be the target

WORKDIR /opt/viewer
COPY packages/viewer/package*.json ./
RUN npm install
COPY packages/viewer .
RUN npm run build

WORKDIR /opt/frontend
# Copy package defs first they are the least likely to change
# Keeping this order will least likely trigger full rebuild
COPY packages/frontend/package*.json ./
RUN npm install ../viewer
RUN npm ci

WORKDIR /opt
COPY packages/server/package*.json server/
ENV NODE_ENV production
RUN npm --prefix server ci server

# Copy remaining files across for frontend. Changes to these files
# will be more common than changes to the dependencies. This should
# speed up rebuilds.
COPY packages/frontend frontend

WORKDIR /opt/frontend
RUN npm run build

# ---
FROM node as runtime

RUN apt-get update && apt-get install -y \
  tini \
  && rm -rf /var/lib/apt/lists/*

# Copy dependencies and static files from build layer
COPY --from=build --chown=node /opt/frontend/dist /home/node/frontend/dist
COPY --from=build --chown=node /opt/server /home/node/server

# Run the application from the non root users home directory
WORKDIR /home/node/server

COPY packages/server /home/node/server

ENV NODE_ENV production

ENTRYPOINT [ "tini", "--" ]
CMD ["node", "bin/www"]
