FROM nginx:1.25-bookworm@sha256:84c52dfd55c467e12ef85cad6a252c0990564f03c4850799bf41dd738738691f
ENV FILE_SIZE_LIMIT_MB=100

RUN mkdir -p /var/nginx
COPY utils/docker-compose-ingress/nginx/templates /etc/nginx/templates
COPY utils/docker-compose-ingress/nginx/conf/mime.types /etc/nginx/mime.types

EXPOSE 8080
