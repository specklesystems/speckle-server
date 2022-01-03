FROM node:16.13-bullseye-slim as node

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

FROM node as runtime

RUN apk add --no-cache tini=0.19.0-r0
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.7.3/wait /wait
RUN chmod +x /wait

# Use a non-root user for increased security.
USER node

ENV NODE_ENV production

# Copy dependencies and static files from build layer
COPY --from=build --chown=node /opt/frontend/dist /home/node/frontend/dist
COPY --from=build --chown=node /opt/server /home/node/server

# Run the application from the non root users home directory
WORKDIR /home/node/server

# Copy remaining files across for the server. Changes to these 
# files will be more common than changes to the dependencies. 
# This should speed up rebuilds.
COPY --chown=node packages/server /home/node/server

# Init for containers https://github.com/krallin/tini
ENTRYPOINT [ "/sbin/tini", "--" ]

CMD /wait && node bin/www
