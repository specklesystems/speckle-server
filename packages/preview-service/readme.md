# PreviewService

This component generates object previews for Speckle Objects.

It reads preview tasks from a Redis backed Bull queue and uses Puppeteer and an internal Viewer to generate previews, which are sent back to a response queue.

This is an overview of this service:

![overview](./docs/preview_service_overview.png)

## Run locally

To run the preview service locally, you need to have a running database and server service. You can use the docker-compose file in the root of this repository to start the database. Please follow instructions in the packages/server README to start the server service. The server is required to provide the database migrations.

Firstly, copy the `.env.example` file to `.env` and fill in the required values.

```bash
cp .env.example .env
```

The install the dependencies with:

```bash
yarn install
```

Then build the service:

```bash
yarn build
```

We also need to build the preview-service frontend:

```bash
yarn build:frontend
```

Then, we need to copy the built artefacts from the preview-service frontend in to the preview-service (backend) directory:

```bash
yarn link:frontend
```

Finally, you can run the preview service with:

```bash
yarn dev
```

This will use the default dev DB connection. You can pass the environment variable `REDIS_URL` to change this to a different DB.

### In a docker image

Navigate to the root of this git repository and build the preview service Dockerfile:

```bash
docker build -f packages/preview-service/Dockerfile -t speckle-preview-service:local .
```

Once you have built the preview service Dockerfile, you can run it like so:

```bash
docker run --rm -p 3001:3001 -e PORT=3001 -e PG_CONNECTION_STRING=postgres://speckle:speckle@host.docker.internal/speckle speckle-preview-service:local
```

## Deployment notes

When deploying the PreviewService, it's important to pay attention to the memory requirements: Speckle streams can be arbitrarily large and the preview service must load the entire stream in order to generate the preview image.

You must limit the PreviewService container memory to a value that you want to allocate for preview generation. If a stream requires more memory then the limit, the preview for that stream will fail, but the entire system remains stable.

To limit the container memory when running with `docker run`, you can use the `-m` flag.

To limit the memory used in the v3 docker compose file, you can use the `mem_limit` key in the `preview-service` service definition.
