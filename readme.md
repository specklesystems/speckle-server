# Speckle Web

[![Twitter Follow](https://img.shields.io/twitter/follow/SpeckleSystems?style=social)](https://twitter.com/SpeckleSystems) [![Community forum users](https://img.shields.io/discourse/users?server=https%3A%2F%2Fspeckle.community&style=flat-square&logo=discourse&logoColor=white)](https://speckle.community) [![website](https://img.shields.io/badge/https://-speckle.systems-royalblue?style=flat-square)](https://speckle.systems) [![docs](https://img.shields.io/badge/docs-speckle.guide-orange?style=flat-square&logo=read-the-docs&logoColor=white)](https://speckle.guide/dev/)

#### Status

[![Speckle-Next](https://circleci.com/gh/specklesystems/speckle-server.svg?style=svg&circle-token=76eabd350ea243575cbb258b746ed3f471f7ac29)](https://github.com/Speckle-Next/SpeckleServer/) [![codecov](https://codecov.io/gh/specklesystems/speckle-server/branch/master/graph/badge.svg)](https://codecov.io/gh/specklesystems/speckle-server)

## Introduction

This monorepo is the home of the Speckle 2.0 web packages. If you're looking for the desktop connectors, you'll find them [here](https://github.com/specklesystems/speckle-sharp).

Specifically, this monorepo contains:

### ➡️ [Server](packages/server), the Speckle Server

The server is a nodejs app. Core external dependencies are a Redis and Postgresql db. Deploy one in a minute on Digital Ocean using the button below!

[![do-btn-blue-re](https://user-images.githubusercontent.com/7696515/120513666-69be0800-c3c4-11eb-9d50-7b9811b8e0f1.png)](https://marketplace.digitalocean.com/apps/speckle-server?refcode=947a2b5d7dc1)

### ➡️ [Frontend](packages/frontend), the Speckle Frontend

The frontend is a static Vue app.

### ➡️ [Viewer](packages/viewer), the Speckle Viewer

[![npm version](https://badge.fury.io/js/%40speckle%2Fviewer.svg)](https://www.npmjs.com/package/@speckle/viewer)

The viewer is a [threejs](https://threejs.org/) extension that allows you to display data from Speckle.

### ➡️ [Object Loader](packages/objectloader), a JS helper module 

[![npm version](https://badge.fury.io/js/%40speckle%2Fobjectloader.svg)](https://www.npmjs.com/package/@speckle/objectloader)

A small utility class that helps you stream an object and all its sub-components from the Speckle Server API.

### ➡️ [Preview Service](packages/preview-service), for headlessly generating images for 3d objects

Generates object previews for Speckle Objects. This package is meant to be called on by the server.

## Documentation

Comprehensive developer and user documentation can be found in our:

#### 📚 [Speckle Docs website](https://speckle.guide/dev/)

## Usage
To start using Speckle, it's not necessary to deploy it yourself. The easiest way is to register a free account on speckle.xyz, our general availability offering. Check [https://speckle.systems/getstarted/](https://speckle.systems/getstarted/) for more information. 

## Developing and Debugging

If you want to deploy the Server, we have a detailed [guide on how to do so](https://speckle.guide/dev/server-setup.html). To get started developing locally, you can read the [run in development mode](https://speckle.guide/dev/server-setup.html#run-in-development-mode) chapter of our deployment guide.

## Contributing

Please make sure you read the [contribution guidelines](CONTRIBUTING.md) for an overview of the best practices we try to follow.

When pushing commits to this repo, please follow the following guidelines:

- Install [commitizen](https://www.npmjs.com/package/commitizen#commitizen-for-contributors) globally (`npm i -g commitizen`).
- When ready to commit, `git cz` & follow the prompts.
- Please use either `server` or `frontend` as the scope of your commit.

## Community

The Speckle Community hangs out on [the forum](https://speckle.community), do join and introduce yourself & feel free to ask us questions!

## Security

For any security vulnerabilities or concerns, please contact us directly at security[at]speckle.systems. 

## License

Unless otherwise described, the code in this repository is licensed under the Apache-2.0 License. Please note that some modules, extensions or code herein might be otherwise licensed. This is indicated either in the root of the containing folder under a different license file, or in the respective file's header. If you have any questions, don't hesitate to get in touch with us via [email](mailto:hello@speckle.systems).
