FROM nginx:1.25-bookworm@sha256:2bdc49f2f8ae8d8dc50ed00f2ee56d00385c6f8bc8a8b320d0a294d9e3b49026
ENV FILE_SIZE_LIMIT_MB=100

RUN mkdir -p /var/nginx
COPY utils/docker-compose-ingress/nginx/templates /etc/nginx/templates
COPY utils/docker-compose-ingress/nginx/conf/mime.types /etc/nginx/mime.types

EXPOSE 8080
