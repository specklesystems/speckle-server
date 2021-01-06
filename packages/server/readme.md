# Speckle Server

[![Twitter Follow](https://img.shields.io/twitter/follow/SpeckleSystems?style=social)](https://twitter.com/SpeckleSystems) [![Discourse users](https://img.shields.io/discourse/users?server=https%3A%2F%2Fdiscourse.speckle.works&style=flat-square)](https://discourse.speckle.works) [![website](https://img.shields.io/badge/www-speckle.systems-royalblue?style=flat-square)](https://speckle.systems)

#### Status

[![Speckle-Next](https://circleci.com/gh/specklesystems/speckle-server.svg?style=svg&circle-token=76eabd350ea243575cbb258b746ed3f471f7ac29)](https://github.com/Speckle-Next/SpeckleServer/) [![codecov](https://codecov.io/gh/specklesystems/speckle-server/branch/master/graph/badge.svg)](https://codecov.io/gh/specklesystems/speckle-server)

## Disclaimer

We're working to stabilize the 2.0 API, and until then there will be breaking changes.

## Introduction

The Speckle Server is a node application. To start it locally, simply:

- ensure you have a local instance of postgres & redis running
- create a postgres db called `speckle2_dev`
- then run `npm install`
- finally `npm run dev` will start the server.
- check `localhost:3000/graphql` out!

You can customise your local deployment by editing and filling in a `.env` file. To do so:

- copy the `.env-example` file to `.env`
- open and edit the `.env` file.

## Developing

The server consists of several semi-related components, or modules. These can be found in `/modules`. Module composition:

- an `index.js` file that exposes two functions, `init` and `finalize` (mandatory)
- a `graph` folder, with two subfolders, namely `resolvers` and `schemas` (optional - these will be picked up and merged).

## Server & Apps

### Frontend

- In **development** mode, the Speckle Server will proxy the frontend from `localhost:8080` to `localhost:3000`. If you don't see anything, ensure you've run `npm run dev` in the frontend package.

- In **production** mode, the Speckle Server will statically serve the frontend app from `../packages/frontend/dist`.

### GraphIQL

A GraphIQL app is available for authenticated api exploration at `localhost:3000/explorer`. Note that for the authentication flow to work, you need to have the frontend running first.

### GraphQL Playground

For non-authenticated api exploration, you can use the Graphql Playground which is available by default at `localhost:3000/graphql`.

## Testing

To run all tests, simply run `npm run test`. To run specific tests, use the `mocha --grep @subset` syntax. For example:

- `mocha --grep @auth --watch` to run tests pertaning to the auth module only in watch mode.
- `mocha --grep @core-streams --watch` to run tests pertaining to stream related services.

## Community

The Speckle Community hangs out on [the forum](https://discourse.speckle.works), do join and introduce yourself & feel free to ask us questions!

## License

Unless otherwise described, the code in this repository is licensed under the Apache-2.0 License. Please note that some modules, extensions or code herein might be otherwise licensed. This is indicated either in the root of the containing folder under a different license file, or in the respective file's header. If you have any questions, don't hesitate to get in touch with us via [email](mailto:hello@speckle.systems).
