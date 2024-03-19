FROM nginx:1.25-bookworm@sha256:6db391d1c0cfb30588ba0bf72ea999404f2764febf0f1f196acd5867ac7efa7e
ENV FILE_SIZE_LIMIT_MB=100

RUN mkdir -p /var/nginx
COPY utils/docker-compose-ingress/nginx/templates /etc/nginx/templates
COPY utils/docker-compose-ingress/nginx/conf/mime.types /etc/nginx/mime.types

EXPOSE 8080
