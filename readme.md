# Speckle Web

[![Twitter Follow](https://img.shields.io/twitter/follow/SpeckleSystems?style=social)](https://twitter.com/SpeckleSystems) [![Discourse users](https://img.shields.io/discourse/users?server=https%3A%2F%2Fdiscourse.speckle.works&style=flat-square)](https://discourse.speckle.works)
[![Slack Invite](https://img.shields.io/badge/-slack-grey?style=flat-square&logo=slack)](https://speckle-works.slack.com/join/shared_invite/enQtNjY5Mzk2NTYxNTA4LTU4MWI5ZjdhMjFmMTIxZDIzOTAzMzRmMTZhY2QxMmM1ZjVmNzJmZGMzMDVlZmJjYWQxYWU0MWJkYmY3N2JjNGI) [![website](https://img.shields.io/badge/www-speckle.systems-royalblue?style=flat-square)](https://speckle.systems)

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

## Developing and Debugging

To get started, first clone this repo & run `npm install`. Next, you'll need to run `lerna boostrap` to initialize the dependencies of all packages (server & frontend).

After these steps are complete, run `lerna run dev --stream`. Alternatively, you can `npm run dev` independently in each separate package (this will make for less spammy output).

#### Server Setup Notes

To run the **Server** in debug mode:

- Duplicate and rename `.env-example` to `.env` & fill it in!
- Make sure a postgres instance is running locally, with two databases present, named `speckle2_dev` and `speckle2_test` (or whatever needed to match your .env `POSTGRES_URL` variable).
- Make sure a redis instance is running locally.
- Run `npm install`
- Run `npm run dev:server` 🚀

#### Frontend

To run the **Frontend** locally in debug mode:

- Switch your working directory to `/frontend`
- Run `npm install`
- Run `npm run dev:frontend` from the Server root folder, or `npm run serve` from `/frontend`.

To build the frontend, simply run `npm run build:frontend`.

#### Frontend & Backend

To run both at the same time with one command only, simply run `npm run dev:all`. Take care: for this to work, you should install the frontend dependencies first.

### Testing

The Server is quite thoroughly covered by tests. We'll aim to keep it that way (>90%). Once you have followed the setup steps above, you can run all the tests by hitting `npm run test:server`.

For testing specific functionality, use `NODE_ENV=test mocha --grep ${scope} --watch`. For example, if you want to test the commit services only, you can run `mocha --grep @core-commits --watch`

## Contributing

Please make sure you read the [contribution guidelines](CONTRIBUTING.md) for an overview of the best practices we try to follow.

When pushing commits to this repo, please follow the following guidelines:

- Install [commitizen](https://www.npmjs.com/package/commitizen#commitizen-for-contributors) globally (`npm i -g commitizen`).
- When ready to commit, `git cz` & follow the prompts.
- Please use either `server` or `frontend` as the scope of your commit.


## Community

The Speckle Community hangs out in two main places, usually:
- on [the forum](https://discourse.speckle.works)
- on [the chat](https://speckle-works.slack.com/join/shared_invite/enQtNjY5Mzk2NTYxNTA4LTU4MWI5ZjdhMjFmMTIxZDIzOTAzMzRmMTZhY2QxMmM1ZjVmNzJmZGMzMDVlZmJjYWQxYWU0MWJkYmY3N2JjNGI)

Do join and introduce yourself!

## License
Unless otherwise described, the code in this repository is licensed under the Apache-2.0 License. Please note that some modules, extensions or code herein might be otherwise licensed. This is indicated either in the root of the containing folder under a different license file, or in the respective file's header. If you have any questions, don't hesitate to get in touch with us via [email](mailto:hello@speckle.systems).
