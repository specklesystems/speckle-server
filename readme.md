# Speckle Web

[![Twitter Follow](https://img.shields.io/twitter/follow/SpeckleSystems?style=social)](https://twitter.com/SpeckleSystems) [![Community forum users](https://img.shields.io/discourse/users?server=https%3A%2F%2Fdiscourse.speckle.works&style=flat-square&logo=discourse&logoColor=white)](https://discourse.speckle.works) [![website](https://img.shields.io/badge/https://-speckle.systems-royalblue?style=flat-square)](https://speckle.systems) [![docs](https://img.shields.io/badge/docs-speckle.guide-orange?style=flat-square&logo=read-the-docs&logoColor=white)](https://speckle.guide/dev/)

#### Status

[![Speckle-Next](https://circleci.com/gh/specklesystems/speckle-server.svg?style=svg&circle-token=76eabd350ea243575cbb258b746ed3f471f7ac29)](https://github.com/Speckle-Next/SpeckleServer/) [![codecov](https://codecov.io/gh/specklesystems/speckle-server/branch/master/graph/badge.svg)](https://codecov.io/gh/specklesystems/speckle-server)

## Disclaimer

We're working to stabilize the 2.0 API, and until then there will be breaking changes.

## Introduction

This monorepo is the home of the Speckle 2.0 web packages. If you're looking for the desktop connectors, you'll find them [here](https://github.com/specklesystems/speckle-sharp).

Specifically, this monorepo contains:

### ➡️ [Server](packages/server), the Speckle Server.

The server is a nodejs app. Core external dependencies are a Redis and Postgresql db.

### ➡️ [Frontend](packages/frontend), the Speckle Frontend.

The frontend is a static Vue app.

### ➡️ [Viewer](packages/viewer), the Speckle Viewer.

The viewer is a [threejs](https://threejs.org/) extension that allows you to display data from Speckle. 

## Documentation

Comprehensive developer and user documentation can be found in our:

#### 📚 [Speckle Docs website](https://speckle.guide/dev/)

## Developing and Debugging

To get started, first clone this repo. Check out the detailed instructions for each module in their respective folder (see links above). 

## Bootsrap local Speckle Server

> prerequisites: [Docker](https://docs.docker.com/get-docker/) and [docker-compose](https://docs.docker.com/compose/install/)

To get a local Server stack up and running quickly:

- clone this repository
- copy `.env-example` file from the server module to the project root and rename to `.env`
- fill out the environment variables in the `.env` file, follow the comment instructions
- run `$ docker-compose up`

This gets you an empty server running on [localhost:3000](http://localhost:3000)

## Contributing

Please make sure you read the [contribution guidelines](CONTRIBUTING.md) for an overview of the best practices we try to follow.

When pushing commits to this repo, please follow the following guidelines:

- Install [commitizen](https://www.npmjs.com/package/commitizen#commitizen-for-contributors) globally (`npm i -g commitizen`).
- When ready to commit, `git cz` & follow the prompts.
- Please use either `server` or `frontend` as the scope of your commit.

## Community

The Speckle Community hangs out on [the forum](https://discourse.speckle.works), do join and introduce yourself & feel free to ask us questions!

## License

Unless otherwise described, the code in this repository is licensed under the Apache-2.0 License. Please note that some modules, extensions or code herein might be otherwise licensed. This is indicated either in the root of the containing folder under a different license file, or in the respective file's header. If you have any questions, don't hesitate to get in touch with us via [email](mailto:hello@speckle.systems).
