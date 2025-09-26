FROM python:3.13-slim-bookworm AS build
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/


# - Silence uv complaining about not being able to use hard links,
# - tell uv to byte-compile packages for faster application startups,
# - prevent uv from accidentally downloading isolated Python builds,
# - pick a Python (use `/usr/bin/python3.12` on uv 0.5.0 and later),
# - and finally declare `/app` as the target for `uv sync`.
ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_DOWNLOADS=never \
    UV_PYTHON=python3.13 \
    UV_PROJECT_ENVIRONMENT=/app


COPY ./packages/ifc-import-service/pyproject.toml ./packages/ifc-import-service/uv.lock /

# Install dependencies using uv
RUN uv sync --frozen --no-dev --no-install-project

COPY ./packages/ifc-import-service /src
WORKDIR /src

RUN --mount=type=cache,target=/root/.cache \
    uv sync \
    --locked \
    --no-dev \
    --no-editable

FROM python:3.13-slim-bookworm

#
# Optional: add the application virtualenv to search path.
ENV PATH=/app/bin:$PATH

# Don't run your app as root.
RUN groupadd -r app && \
useradd -r -d /app -g app -N app


STOPSIGNAL SIGINT

COPY --from=build --chown=app:app /app /app
COPY --chown=app:app ./packages/ifc-import-service/main.py /app
# COPY --chown=appuser:appuser . .
#
# Switch to non-root user
USER app
WORKDIR /app

# Reset the entrypoint, don't invoke `uv`
ENTRYPOINT []

CMD ["python", "main.py"]
