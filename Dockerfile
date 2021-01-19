FROM node:14.15.4-alpine3.10@sha256:fe215d05cdde4b7f2a0f546c88a8ddc4f5fa280a204acdfc2383afe901fd6d84 as build

WORKDIR /home/node

# Having multiple steps in builder doesn't increase the final image size
# So having verbose steps for readability and caching should be the target 

# 1. Copy package defs first they are the least likely to change
# Keeping this order will least likely trigger full rebuild
COPY packages/frontend/package*.json frontend/
COPY packages/server/package*.json server/

# 2. Install packages 
# Use dev environment to install dev packages for frontend build
ENV NODE_ENV development
RUN npm --prefix frontend ci frontend

# Switch to production env for server install
ENV NODE_ENV production
RUN npm --prefix server ci server

# 3. build frontend to static files
# when testing container build, most propably not the frontend files are the ones
# that are changing. So having a separate copy and build step speeds up the container
# build.
COPY packages/frontend frontend
RUN npm --prefix frontend run build

COPY packages/server server
FROM node:14.15.4-alpine3.10@sha256:fe215d05cdde4b7f2a0f546c88a8ddc4f5fa280a204acdfc2383afe901fd6d84

ENV NODE_ENV production

RUN mkdir -p frontend/dist server

# only copy in the build artifacts for the frontend
COPY --from=build --chown=node /home/node/frontend/dist frontend/dist
# copy the server with installed modules
COPY --from=build --chown=node /home/node/server server

# change to no root user, node
USER node

WORKDIR /server
CMD ["node", "bin/www"]
