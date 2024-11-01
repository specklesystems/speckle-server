FROM postgres:14-alpine3.20 as builder

RUN apk add --no-cache 'git=~2.45' \
    'build-base=~0.5' \
    'clang15=~15' \
    'llvm15=~15'

WORKDIR /
RUN git clone https://github.com/aiven/aiven-extras.git aiven-extras

WORKDIR /aiven-extras
RUN git checkout c51cbeb127acef663c53dbe89d2726d9109e421b \
  && git clean -df \
  && make \
  && make install

FROM postgres:14-alpine3.20

COPY --from=builder /aiven-extras/aiven_extras.control /usr/local/share/postgresql/extension/aiven_extras.control
COPY --from=builder /aiven-extras/sql/aiven_extras.sql /usr/local/share/postgresql/extension/aiven_extras--1.1.14.sql
COPY --from=builder /aiven-extras/aiven_extras.so /usr/local/lib/postgresql/aiven_extras.so

EXPOSE 5432

CMD ["postgres"]
