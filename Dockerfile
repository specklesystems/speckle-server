FROM node:12.20.1-alpine3.12@sha256:42998ae4420998ff3255fc2d6884e882bd32f06d45b057f4b042e33bf48a1240 as build
# Having multiple steps in builder doesn't increase the final image size
# So having verbose steps for readability and caching should be the target 

WORKDIR /opt

# Copy package defs first they are the least likely to change
# Keeping this order will least likely trigger full rebuild
COPY packages/frontend/package*.json frontend/
RUN npm --prefix frontend ci frontend

COPY packages/server/package*.json server/
ENV NODE_ENV production
RUN npm --prefix server ci server

# Copy remaining files across for frontend. Changes to these files 
# will be more common than changes to the dependencies. This should 
# speed up rebuilds.
COPY packages/frontend frontend

WORKDIR /opt/frontend
RUN npm run build

FROM node:12.20.1-alpine3.12@sha256:42998ae4420998ff3255fc2d6884e882bd32f06d45b057f4b042e33bf48a1240

RUN apk add --no-cache tini=0.19.0-r0

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

CMD ["node", "bin/www"]