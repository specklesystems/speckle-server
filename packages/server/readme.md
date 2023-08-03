# Speckle Server

[![Twitter Follow](https://img.shields.io/twitter/follow/SpeckleSystems?style=social)](https://twitter.com/SpeckleSystems) [![Community forum users](https://img.shields.io/discourse/users?server=https%3A%2F%2Fspeckle.community&style=flat-square&logo=discourse&logoColor=white)](https://speckle.community) [![website](https://img.shields.io/badge/https://-speckle.systems-royalblue?style=flat-square)](https://speckle.systems) [![docs](https://img.shields.io/badge/docs-speckle.guide-orange?style=flat-square&logo=read-the-docs&logoColor=white)](https://speckle.guide/dev/)

#### Status

[![Speckle-Next](https://circleci.com/gh/specklesystems/speckle-server.svg?style=svg&circle-token=76eabd350ea243575cbb258b746ed3f471f7ac29)](https://github.com/Speckle-Next/SpeckleServer/) [![codecov](https://codecov.io/gh/specklesystems/speckle-server/branch/master/graph/badge.svg)](https://codecov.io/gh/specklesystems/speckle-server)
[![pre-commit.ci status](https://results.pre-commit.ci/badge/github/specklesystems/speckle-server/main.svg)](https://results.pre-commit.ci/latest/github/specklesystems/speckle-server/main)

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
- (if you plan to run tests) copy the `.env.test-example` file to `.env.test`
- If you have a custom setup, open and edit the `.env` & `.env.test` files, filling in the required variables,
- run `yarn install`,
- finally `yarn dev`,
- check `127.0.0.1:3000/graphql` out!

## Developing

The server consists of several semi-related components, or modules. These can be found in `/modules`. Module composition:

- an `index.js` file that exposes two functions, `init` and `finalize` (mandatory)
- a `graph` folder, with two subfolders, namely `resolvers` and `schemas` (optional - these will be picked up and merged).

### TypeScript

This package has TypeScript support and you can use TS everywhere in it - modules, tests, migrations (read note about migrations below).

To run the app, build it first into `/dist` and then run it through `./bin/www`. Or just run - `yarn dev` which will run the TS compiler in watch mode and also run the build app through `nodemon`.

Tests and the CLI, however, do not need an explicit build inside the `/dist` folder as they use `ts-node` to execute TS files directly. This is to improve the DX and allow you to iterate on tests faster, without having to run the TS compiler.

#### GraphQL types

Whenever a schema changes you can run `yarn gqlgen` to regenerate GraphQL types at `@/modules/core/graph/generated/graphql.ts`. This file will hold types for scalars, variables and most importantly - resolvers.

You can get the best DX by typing your resolvers with the `Resolvers` type and then you will get proper type checking for parent, arguments and so on in your resolvers.

### Migrations

To create new migrations use `yarn migrate create`. Note that migrations are only ever read from the `./dist` folder to avoid scenarious when both the TS and JS version of the same migration is executed, so if you ever create a new migration make sure
you build the app into `/dist` if you want it to be applied.

### CLI

We've got a yargs based dev-only CLI that you can run and extend with useful commands. Run it through `yarn cli` and add new commands under `./modules/cli`

### Bull queue monitoring

Use `yarn cli bull monitor` to serve a Web UI for our Bull queues (e.g. Notifications queues). In the prod env we don't retain old jobs, but locally these older results aren't deleted and you'll see them in this Web UI.

## Server & Apps

### Frontend

- In **development** mode, the Speckle Server will proxy the frontend from `127.0.0.1:3000` to `127.0.0.1:8080`.
  If you don't see anything, ensure you've run `yarn dev` in the frontend package.

- In **production** mode, the frontend is served by an `nginx` container that proxy server requests to the server (depending on the requested path). For more information about making a production deployment, check out [our detailed guide](https://speckle.guide/dev/server-setup.html)

### GraphIQL

A GraphIQL app is available for authenticated api exploration at `127.0.0.1:3000/explorer`. Note that for the authentication flow to work, you need to have the frontend running first.

### GraphQL Playground

For non-authenticated api exploration, you can use the Graphql Playground which is available by default at `127.0.0.1:3000/graphql`.

## Testing

To run all tests, simply run `yarn test`.
The recommended extensions for the workspace include a test explorer, that can run individual tests.

If you really want to run specific tests from a terminal, use the `mocha --grep @subset` syntax. For example:

- `mocha --grep @auth --watch` to run tests pertaning to the auth module only in watch mode.
- `mocha --grep @core-streams --watch` to run tests pertaining to stream related services.

It's suggested to just run tests from the VSCode test explorer, however.

### Integration tests with GraphQL

The best way to do integration tests is to actually invoke queries against an `ApolloServer` instance. To make this process even better you can rely on GraphQL Code Generator to properly generate types for the queries you write in your tests.

Put your test-specific queries/mutations in `@/test/graphql` and then run `yarn gqlgen`. This will generate a typings file at `@/test/graphql/generated/graphql.ts` which will contain query & variable types for the operations you've created.

You can then specify these types when running operations through `executeOperation` from `@/test/graphqlHelper.ts` (through the generic arguments), and then inside your TS test file you'll get properly typed response structures. Awesome!

## Community

The Speckle Community hangs out on [the forum](https://speckle.community), do join and introduce yourself & feel free to ask us questions!

## License

Unless otherwise described, the code in this repository is licensed under the Apache-2.0 License. Please note that some modules, extensions or code herein might be otherwise licensed. This is indicated either in the root of the containing folder under a different license file, or in the respective file's header. If you have any questions, don't hesitate to get in touch with us via [email](mailto:hello@speckle.systems).
