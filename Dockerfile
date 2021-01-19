FROM node:14.15.4-alpine3.10@sha256:fe215d05cdde4b7f2a0f546c88a8ddc4f5fa280a204acdfc2383afe901fd6d84 as build

USER node

WORKDIR /home/node

COPY --chown=node packages/ .

RUN npm --prefix frontend install frontend && \
    npm --prefix frontend run build

FROM node:14.15.4-alpine3.10@sha256:fe215d05cdde4b7f2a0f546c88a8ddc4f5fa280a204acdfc2383afe901fd6d84

ENV NODE_ENV production

RUN mkdir -p frontend/dist server

COPY --from=build /home/node/frontend/dist frontend/dist
COPY --chown=node packages/server server

RUN npm --prefix server install server

USER node

WORKDIR /home/node/server

CMD ["node", "bin/www"]