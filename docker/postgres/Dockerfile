FROM postgres:14.5-alpine as builder

RUN apk update \
    && apk add git \
    build-base \
    clang \
    llvm

RUN git clone --branch 1.1.9 https://github.com/aiven/aiven-extras.git aiven-extras \
  && cd aiven-extras \
  && make \
  && make install

FROM postgres:14.5-alpine

COPY --from=builder /aiven-extras/aiven_extras.control /usr/local/share/postgresql/extension/aiven_extras.control
COPY --from=builder /aiven-extras/sql/aiven_extras.sql /usr/local/share/postgresql/extension/aiven_extras--1.1.9.sql
COPY --from=builder /aiven-extras/aiven_extras.so /usr/local/lib/postgresql/aiven_extras.so

EXPOSE 5432

CMD ["postgres"]
