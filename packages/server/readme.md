# Speckle Server

[![Twitter Follow](https://img.shields.io/twitter/follow/SpeckleSystems?style=social)](https://twitter.com/SpeckleSystems) [![Community forum users](https://img.shields.io/discourse/users?server=https%3A%2F%2Fspeckle.community&style=flat-square&logo=discourse&logoColor=white)](https://speckle.community) [![website](https://img.shields.io/badge/https://-speckle.systems-royalblue?style=flat-square)](https://speckle.systems) [![docs](https://img.shields.io/badge/docs-speckle.guide-orange?style=flat-square&logo=read-the-docs&logoColor=white)](https://speckle.guide/dev/)

#### Status

[![Speckle-Next](https://circleci.com/gh/specklesystems/speckle-server.svg?style=svg&circle-token=76eabd350ea243575cbb258b746ed3f471f7ac29)](https://github.com/Speckle-Next/SpeckleServer/) [![codecov](https://codecov.io/gh/specklesystems/speckle-server/branch/master/graph/badge.svg)](https://codecov.io/gh/specklesystems/speckle-server)

## Disclaimer

We're working to stabilize the 2.0 API, and until then there will be breaking changes.

## Documentation

Comprehensive developer and user documentation can be found in our:

#### 📚 [Speckle Docs website](https://speckle.guide/dev/)

## Introduction

The Speckle Server is a node application tested against v12.

The external dependencies are **PostgreSQL** and **Redis**. To get the dependencies running without any hassle, you can run them in docker containers as described in our [Server deployment instructions](https://speckle.guide/dev/server-setup.html#step-1-set-up-dependencies) (chapter `Run your speckle-server fork`, step 1)


> **_NOTE:_** If you install PostgreSQL yourself or use an existing PostgreSQL instance, make sure to create a database and a user that can access it

After you have PostgreSQL and Redis running, in the `packages/server` folder:

- copy the `.env-example` file to `.env`,
- If you have a custom setup, open and edit the `.env` file, filling in the required variables,
- run `npm install`,
- finally `npm run dev`,
- check `localhost:3000/graphql` out!

## Developing

The server consists of several semi-related components, or modules. These can be found in `/modules`. Module composition:

- an `index.js` file that exposes two functions, `init` and `finalize` (mandatory)
- a `graph` folder, with two subfolders, namely `resolvers` and `schemas` (optional - these will be picked up and merged).

## Server & Apps

### Frontend

- In **development** mode, the Speckle Server will proxy the frontend from `localhost:3000` to `localhost:8080`. If you don't see anything, ensure you've run `npm run dev` in the frontend package.

- In **production** mode, the frontend is served by an `nginx` container that proxy server requests to the server (depending on the requested path). For more information about making a production deployment, check out [our detailed guide](https://speckle.guide/dev/server-setup.html)

### GraphIQL

A GraphIQL app is available for authenticated api exploration at `localhost:3000/explorer`. Note that for the authentication flow to work, you need to have the frontend running first.

### GraphQL Playground

For non-authenticated api exploration, you can use the Graphql Playground which is available by default at `localhost:3000/graphql`.

## Testing

To run all tests, simply run `npm run test`. To run specific tests, use the `mocha --grep @subset` syntax. For example:

- `mocha --grep @auth --watch` to run tests pertaning to the auth module only in watch mode.
- `mocha --grep @core-streams --watch` to run tests pertaining to stream related services.

## Community

The Speckle Community hangs out on [the forum](https://speckle.community), do join and introduce yourself & feel free to ask us questions!

## License

Unless otherwise described, the code in this repository is licensed under the Apache-2.0 License. Please note that some modules, extensions or code herein might be otherwise licensed. This is indicated either in the root of the containing folder under a different license file, or in the respective file's header. If you have any questions, don't hesitate to get in touch with us via [email](mailto:hello@speckle.systems).
