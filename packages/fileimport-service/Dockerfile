ARG NODE_ENV=production

FROM mcr.microsoft.com/dotnet/sdk:8.0-noble AS dotnet-build-stage
WORKDIR /app
COPY packages/ifc-converter .
RUN ls
RUN dotnet publish ifc-converter.csproj -c Release -o output/


FROM mcr.microsoft.com/dotnet/runtime:8.0-noble AS runtime

WORKDIR /speckle-server

# install tini
ARG TINI_VERSION=v0.19.0
ENV TINI_VERSION=${TINI_VERSION}
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini ./tini
RUN chmod +x ./tini

# install wait
ARG WAIT_VERSION=2.8.0
ENV WAIT_VERSION=${WAIT_VERSION}
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/${WAIT_VERSION}/wait ./wait
RUN chmod +x ./wait

RUN apt-get update
RUN apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install nodejs -y
RUN npm install -g yarn

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
RUN apt-get update
RUN apt-get install software-properties-common -y
RUN add-apt-repository "ppa:deadsnakes/ppa"
RUN apt-get install python3.12 python3.12-venv pip -y

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

COPY --from=dotnet-build-stage /app/output packages/ifc-converter

ENTRYPOINT [ "./tini", "--", "node", "--no-experimental-fetch", "packages/fileimport-service/src/daemon.js"]
