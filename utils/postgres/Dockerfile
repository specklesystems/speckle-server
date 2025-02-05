FROM postgres:16.4-alpine3.20@sha256:d898b0b78a2627cb4ee63464a14efc9d296884f1b28c841b0ab7d7c42f1fffdf AS builder

RUN apk add --no-cache 'git=2.45.3-r0' \
    'build-base=0.5-r3' \
    'clang15=15.0.7-r19' \
    'llvm15=15.0.7-r13'

WORKDIR /aiven-extras
# hack to clone only a single commit, so that the cache is not invalidated by other changes in the repo
RUN git init \
  && git remote add origin https://github.com/aiven/aiven-extras.git \
  && git fetch --depth 1 origin c51cbeb127acef663c53dbe89d2726d9109e421b \
  && git checkout FETCH_HEAD \
  && make \
  && make install

FROM postgres:16.4-alpine3.20@sha256:d898b0b78a2627cb4ee63464a14efc9d296884f1b28c841b0ab7d7c42f1fffdf AS runner

COPY --link --from=builder /aiven-extras/aiven_extras.control /usr/local/share/postgresql/extension/aiven_extras.control
COPY --link --from=builder /aiven-extras/sql/aiven_extras.sql /usr/local/share/postgresql/extension/aiven_extras--1.1.14.sql
COPY --link --from=builder /aiven-extras/aiven_extras.so /usr/local/lib/postgresql/aiven_extras.so

EXPOSE 5432

CMD ["postgres"]
