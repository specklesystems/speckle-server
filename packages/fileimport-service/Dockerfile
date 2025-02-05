ARG NODE_ENV=production

FROM mcr.microsoft.com/dotnet/sdk:8.0-noble AS dotnet-build-stage
WORKDIR /app
COPY packages/fileimport-service/ifc-dotnet .
RUN dotnet publish ifc-converter.csproj -c Release -o output/


FROM mcr.microsoft.com/dotnet/runtime:8.0-noble AS runtime
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

WORKDIR /speckle-server

# configure tini
ARG TINI_VERSION=v0.19.0
ENV TINI_VERSION=${TINI_VERSION}

# hadolint ignore=DL3008
RUN apt-get update -y \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y \
     --no-install-recommends \
     ca-certificates=20240203 \
     curl=8.5.0-2ubuntu10.6 \
     gosu=1.17-1ubuntu0.24.04.2 \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && curl -fsSL https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini -o /usr/bin/tini \
    && chmod +x /usr/bin/tini \
    && curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh \
    && gosu root:root bash nodesource_setup.sh \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y \
     --no-install-recommends \
     nodejs \
    && echo ">>>>>> NODE Version: $(node --version)" \
    && npm install -g corepack@0.30.0 \
    && corepack enable \
    && DEBIAN_FRONTEND=noninteractive apt-get remove curl -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# download yarn dependencies for building shared libraries
COPY .yarnrc.yml .
COPY .yarn ./.yarn
COPY package.json yarn.lock ./

COPY packages/frontend-2/type-augmentations/stubs packages/frontend-2/type-augmentations/stubs/
COPY packages/shared/package.json packages/shared/
COPY packages/fileimport-service/package.json packages/fileimport-service/

RUN yarn workspaces focus --all

# build shared libraries
COPY packages/shared packages/shared/
COPY packages/fileimport-service packages/fileimport-service/
RUN yarn workspaces foreach -W run build

# Install python virtual env and python dependencies
RUN apt-get update -y \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y \
     --no-install-recommends \
     python3.12=3.12.3-1ubuntu0.4 \
     python3-pip=24.0+dfsg-1ubuntu1.1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY packages/fileimport-service/requirements.txt /speckle-server/
RUN pip install --break-system-packages --disable-pip-version-check --no-cache-dir --requirement /speckle-server/requirements.txt

ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}
ARG NODE_BINARY_PATH=/usr/bin/node
ENV NODE_BINARY_PATH=${NODE_BINARY_PATH}
ARG PYTHON_BINARY_PATH=/usr/bin/python3
ENV PYTHON_BINARY_PATH=${PYTHON_BINARY_PATH}
ARG DOTNET_BINARY_PATH=/usr/bin/dotnet
ENV DOTNET_BINARY_PATH=${DOTNET_BINARY_PATH}

COPY --link --from=dotnet-build-stage /app/output packages/fileimport-service/ifc-dotnet

WORKDIR /speckle-server/packages/fileimport-service

ENTRYPOINT [ "tini", "--", "node", "--no-experimental-fetch", "src/daemon.js"]
