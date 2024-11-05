FROM postgres:16.4-alpine3.20@sha256:d898b0b78a2627cb4ee63464a14efc9d296884f1b28c841b0ab7d7c42f1fffdf AS builder

RUN apk add --no-cache 'git=~2.36' \
    'build-base=~0.5' \
    'clang=~13.0' \
    'llvm13=~13.0'

WORKDIR /
RUN git clone --branch 1.1.9 https://github.com/aiven/aiven-extras.git aiven-extras

WORKDIR /aiven-extras
RUN git checkout 36598ab \
  && git clean -df \
  && make \
  && make install

FROM postgres:16.4-alpine3.20@sha256:d898b0b78a2627cb4ee63464a14efc9d296884f1b28c841b0ab7d7c42f1fffdf AS runner

COPY --from=builder /aiven-extras/aiven_extras.control /usr/local/share/postgresql/extension/aiven_extras.control
COPY --from=builder /aiven-extras/sql/aiven_extras.sql /usr/local/share/postgresql/extension/aiven_extras--1.1.9.sql
COPY --from=builder /aiven-extras/aiven_extras.so /usr/local/lib/postgresql/aiven_extras.so

EXPOSE 5432

CMD ["postgres"]
