# PreviewService

This component generates object previews for Speckle Objects.

It reads preview tasks from the DB and uses Puppeteer and an internal Viewer to generate previews, which are currently stored in the DB.

This is an overview of this service:

![overview](./docs/preview_service_overview.png)

## Run locally

With an updated viewer installed in the current directory, you should first build the frontend-part of the preview service: The simple webpage with the viewer that will be accessed with Puppeteer to generate the preview:

```
npm run build-fe
```

This should be rerun whenever you make changes to the viewer (if you make local viewer changes, don't forget to build the viewer module before running this)

After the viewer web page is up to date, run the preview service with:
```
npm run dev
```

This will use the default dev DB connection of `postgres://speckle:speckle@localhost/speckle`. You can pass the environment variable `PG_CONNECTION_STRING` to change this to a different DB.

## Deployment notes

When deploying the PreviewService, it's important to pay attention to the memory requirements: Speckle streams can be arbitrarily large and the preview service must load the entire stream in order to generate the preview image.

You must limit the PreviewService container memory to a value that you want to allocate for preview generation. If a stream requires more memory then the limit, the preview for that stream will fail, but the entire system remains stable.

To limit the container memory when running with `docker run`, you can use the `-m` flag.

With docker-compose, you must use a docker-compose file at version 2 (not 3) and use the `mem_limit` option.
