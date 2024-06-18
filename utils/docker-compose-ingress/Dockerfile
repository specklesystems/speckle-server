FROM nginx:1.25-bookworm@sha256:a484819eb60211f5299034ac80f6a681b06f89e65866ce91f356ed7c72af059c
ENV FILE_SIZE_LIMIT_MB=100

RUN mkdir -p /var/nginx
COPY utils/docker-compose-ingress/nginx/templates /etc/nginx/templates
COPY utils/docker-compose-ingress/nginx/conf/mime.types /etc/nginx/mime.types

EXPOSE 8080