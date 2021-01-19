# Initial build stage. Will not be included in minimal production image
FROM node:12.20.1-alpine3.12@sha256:42998ae4420998ff3255fc2d6884e882bd32f06d45b057f4b042e33bf48a1240 as build

WORKDIR /opt

COPY packages/frontend .

# Create the static frontend files in the dist folder
RUN npm ci && \
    npm run build

# Minimal production image
FROM node:12.20.1-alpine3.12@sha256:42998ae4420998ff3255fc2d6884e882bd32f06d45b057f4b042e33bf48a1240

ENV NODE_ENV production

RUN apk add --no-cache tini=0.19.0-r0

RUN mkdir frontend server

COPY --from=build --chown=node /opt/dist /home/node/frontend/dist

COPY --chown=node packages/server /home/node/server

# Use a non-root user for security best practices
USER node

# Run the application from the non root users home directory
WORKDIR /home/node/server

# Install dependencies
RUN npm ci

# Init for containers https://github.com/krallin/tini
ENTRYPOINT [ "/sbin/tini", "--" ]

CMD ["node", "bin/www"]