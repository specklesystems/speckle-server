FROM postgres:16.4-alpine3.20@sha256:5660c2cbfea50c7a9127d17dc4e48543eedd3d7a41a595a2dfa572471e37e64c AS builder

RUN apk add --no-cache 'git=2.45.4-r0' \
  'build-base=0.5-r3' \
  'clang15=15.0.7-r19' \
  'llvm15=15.0.7-r14'

WORKDIR /aiven-extras
# hack to clone only a single commit, so that the cache is not invalidated by other changes in the repo
RUN git init \
  && git remote add origin https://github.com/aiven/aiven-extras.git \
  && git fetch --depth 1 origin c51cbeb127acef663c53dbe89d2726d9109e421b \
  && git checkout FETCH_HEAD \
  && make \
  && make install

FROM postgres:16.4-alpine3.20@sha256:5660c2cbfea50c7a9127d17dc4e48543eedd3d7a41a595a2dfa572471e37e64c AS runner

COPY --link --from=builder /aiven-extras/aiven_extras.control /usr/local/share/postgresql/extension/aiven_extras.control
COPY --link --from=builder /aiven-extras/sql/aiven_extras.sql /usr/local/share/postgresql/extension/aiven_extras--1.1.14.sql
COPY --link --from=builder /aiven-extras/aiven_extras.so /usr/local/lib/postgresql/aiven_extras.so

EXPOSE 5432

CMD ["postgres", "-c", "max_prepared_transactions=150"]
