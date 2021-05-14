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
