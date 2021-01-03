# Server

[![Twitter Follow](https://img.shields.io/twitter/follow/SpeckleSystems?style=social)](https://twitter.com/SpeckleSystems) [![Discourse users](https://img.shields.io/discourse/users?server=https%3A%2F%2Fdiscourse.speckle.works&style=flat-square)](https://discourse.speckle.works)
[![Slack Invite](https://img.shields.io/badge/-slack-grey?style=flat-square&logo=slack)](https://speckle-works.slack.com/join/shared_invite/enQtNjY5Mzk2NTYxNTA4LTU4MWI5ZjdhMjFmMTIxZDIzOTAzMzRmMTZhY2QxMmM1ZjVmNzJmZGMzMDVlZmJjYWQxYWU0MWJkYmY3N2JjNGI) [![website](https://img.shields.io/badge/www-speckle.systems-royalblue?style=flat-square)](https://speckle.systems)

#### Status

[![Speckle-Next](https://circleci.com/gh/specklesystems/speckle-server.svg?style=svg&circle-token=76eabd350ea243575cbb258b746ed3f471f7ac29)](https://github.com/Speckle-Next/SpeckleServer/) [![codecov](https://codecov.io/gh/specklesystems/speckle-server/branch/master/graph/badge.svg)](https://codecov.io/gh/specklesystems/speckle-server)

## Disclaimer
This is an early alpha release, not meant for use in production! We're working to stabilise the 2.0 API, and until then there will be breaking changes. You have been warned!

## Introduction

This is the Speckle Server 2.0. It consists of two distinct parts:

- The server application itself, which is a nodejs app,
- The frontend application, which is a static vuejs app.

For example usage, do check out the tests! We'll be also adding preliminary documentation [on our forum](https://discourse.speckle.works/c/speckle-insider/10).

## Developing and Debugging

To get started, first clone this repo.

### Setup

#### Server

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

The Server is quite thoroughly covered by tests. We'll aim to keep it that way. Once you have followed the setup steps above, you can run all the tests by hitting `npm run test:server`.

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
