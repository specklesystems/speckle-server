# FROM node:14-alpine AS node
FROM node:14 AS node

# -e "NODE_ENV=production"

FROM node as builder

WORKDIR /frontend

COPY ./packages/frontend/package*.json ./
RUN npm ci

COPY ./packages/frontend ./

RUN npm run build

WORKDIR /app
COPY ./packages/server/package*.json ./

RUN npm ci

COPY ./packages/server ./

# FROM node:14-alpine as final
EXPOSE 3000

# COPY --from=builder /app /app
# COPY --from=builder /frontend /frontend

# WORKDIR /app

CMD node ./bin/www