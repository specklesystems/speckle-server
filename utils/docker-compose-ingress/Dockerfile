FROM nginx:1.25-bookworm@sha256:9784f7985f6fba493ba30fb68419f50484fee8faaf677216cb95826f8491d2e9
ENV FILE_SIZE_LIMIT_MB=100

RUN mkdir -p /var/nginx
COPY utils/docker-compose-ingress/nginx/templates /etc/nginx/templates
COPY utils/docker-compose-ingress/nginx/conf/mime.types /etc/nginx/mime.types

EXPOSE 8080
