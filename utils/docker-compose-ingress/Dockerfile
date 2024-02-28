FROM nginx:1.25-bookworm@sha256:c26ae7472d624ba1fafd296e73cecc4f93f853088e6a9c13c0d52f6ca5865107
ENV FILE_SIZE_LIMIT_MB=100

RUN mkdir -p /var/nginx
COPY utils/docker-compose-ingress/nginx/templates /etc/nginx/templates
COPY utils/docker-compose-ingress/nginx/conf/mime.types /etc/nginx/mime.types

EXPOSE 8080
