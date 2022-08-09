<h1 align="center">
  <img src="https://user-images.githubusercontent.com/2679513/131189167-18ea5fe1-c578-47f6-9785-3748178e4312.png" width="150px"/><br/>
  Speckle | Server
</h1>
<h3 align="center">
    Server and Web packages
</h3>
<p align="center"><b>Speckle</b> is data infrastructure for the AEC industry.</p><br/>

<p align="center"><a href="https://twitter.com/SpeckleSystems"><img src="https://img.shields.io/twitter/follow/SpeckleSystems?style=social" alt="Twitter Follow"></a> <a href="https://speckle.community"><img src="https://img.shields.io/discourse/users?server=https%3A%2F%2Fspeckle.community&amp;style=flat-square&amp;logo=discourse&amp;logoColor=white" alt="Community forum users"></a> <a href="https://speckle.systems"><img src="https://img.shields.io/badge/https://-speckle.systems-royalblue?style=flat-square" alt="website"></a> <a href="https://speckle.guide/dev/"><img src="https://img.shields.io/badge/docs-speckle.guide-orange?style=flat-square&amp;logo=read-the-docs&amp;logoColor=white" alt="docs"></a></p>

<p align="center">
<a href="https://github.com/Speckle-Next/SpeckleServer/"><img src="https://circleci.com/gh/specklesystems/speckle-server.svg?style=svg&amp;circle-token=76eabd350ea243575cbb258b746ed3f471f7ac29" alt="Speckle-Next">
</a> 
<a href="https://codecov.io/gh/specklesystems/speckle-server">
<img src="https://codecov.io/gh/specklesystems/speckle-server/branch/master/graph/badge.svg" alt="codecov">
</a>
<a href="https://results.pre-commit.ci/latest/github/specklesystems/speckle-server/main">
<img src="https://results.pre-commit.ci/badge/github/specklesystems/speckle-server/main.svg" alt="codecov">
</a>
</p>

# About Speckle

What is Speckle? Check our [![YouTube Video Views](https://img.shields.io/youtube/views/B9humiSpHzM?label=Speckle%20in%201%20minute%20video&style=social)](https://www.youtube.com/watch?v=B9humiSpHzM)

### Features

- **Object-based:** say goodbye to files! Speckle is the first object based platform for the AEC industry
- **Version control:** Speckle is the Git & Hub for geometry and BIM data
- **Collaboration:** share your designs collaborate with others
- **3D Viewer:** see your CAD and BIM models online, share and embed them anywhere
- **Interoperability:** get your CAD and BIM models into other software without exporting or importing
- **Real time:** get real time updates and notifications and changes
- **GraphQL API:** get what you need anywhere you want it
- **Webhooks:** the base for a automation and next-gen pipelines
- **Built for developers:** we are building Speckle with developers in mind and got tools for every stack
- **Built for the AEC industry:** Speckle connectors are plugins for the most common software used in the industry such as Revit, Rhino, Grasshopper, AutoCAD, Civil 3D, Excel, Unreal Engine, Unity, QGIS, Blender, ArchiCAD and more!

### Try Speckle now!

Give Speckle a try in no time by:

- [![speckle XYZ](https://img.shields.io/badge/https://-speckle.xyz-0069ff?style=flat-square&logo=hackthebox&logoColor=white)](https://speckle.xyz) ⇒ creating an account at
- [![create a droplet](https://img.shields.io/badge/Create%20a%20Droplet-0069ff?style=flat-square&logo=digitalocean&logoColor=white)](https://marketplace.digitalocean.com/apps/speckle-server?refcode=947a2b5d7dc1) ⇒ deploying an instance in 1 click

### Resources

- [![Community forum users](https://img.shields.io/badge/community-forum-green?style=for-the-badge&logo=discourse&logoColor=white)](https://speckle.community) for help, feature requests or just to hang with other speckle enthusiasts, check out our community forum!
- [![website](https://img.shields.io/badge/tutorials-speckle.systems-royalblue?style=for-the-badge&logo=youtube)](https://speckle.systems) our tutorials portal is full of resources to get you started using Speckle
- [![docs](https://img.shields.io/badge/docs-speckle.guide-orange?style=for-the-badge&logo=read-the-docs&logoColor=white)](https://speckle.guide/dev/) reference on almost any end-user and developer functionality

# Repo structure

This monorepo is the home of the Speckle v2 web packages:

- [`packages/server`](https://github.com/specklesystems/speckle-server/blob/main/packages/server): the Server, a nodejs app. Core external dependencies are a Redis and Postgresql db.
- [`packages/frontend`](https://github.com/specklesystems/speckle-server/blob/main/packages/frontend): the Frontend, a static Vue app.
- [`packages/viewer`](https://github.com/specklesystems/speckle-server/blob/main/packages/viewer): a threejs extension that allows you to display 3D data [![npm version](https://camo.githubusercontent.com/dc69232cc57b77de6554e752dd6dfc60ca0ecdfbe91bdfcbf7c7531a511ec200/68747470733a2f2f62616467652e667572792e696f2f6a732f253430737065636b6c652532467669657765722e737667)](https://www.npmjs.com/package/@speckle/viewer)
- [`packages/objectloader`](https://github.com/specklesystems/speckle-server/blob/main/packages/objectloader): a small js utility class that helps you stream an object and all its sub-components from the Speckle Server API. [![npm version](https://camo.githubusercontent.com/4d4f1e38ce50aaf11b4a3ad8e01ce3eaaa561dc5fd08febbae556f52f1d41097/68747470733a2f2f62616467652e667572792e696f2f6a732f253430737065636b6c652532466f626a6563746c6f616465722e737667)](https://www.npmjs.com/package/@speckle/objectloader)
- [`packages/preview-service`](https://github.com/specklesystems/speckle-server/blob/main/packages/preview-service): generates object previews for Speckle Objects headlessly. This package is meant to be called on by the server.
- [`packages/webhook-service`](https://github.com/specklesystems/speckle-server/tree/main/packages/webhook-service): making external webhook calls
- [`packages/fileimport-service`](https://github.com/specklesystems/speckle-server/tree/main/packages/fileimport-service): parsing and importing files

### Other repos

Make sure to also check and ⭐️ these other Speckle repositories:

- [`speckle-sharp`](https://github.com/specklesystems/speckle-sharp): .NET tooling, connectors and interoperability
- [`specklepy`](https://github.com/specklesystems/specklepy): Python SDK 🐍
- [`speckle-excel`](https://github.com/specklesystems/speckle-excel): Excel connector
- [`speckle-unity`](https://github.com/specklesystems/speckle-unity): Unity 3D connector
- [`speckle-blender`](https://github.com/specklesystems/speckle-blender): Blender connector
- [`speckle-unreal`](https://github.com/specklesystems/speckle-unreal): Unreal Engine connector
- [`speckle-qgis`](https://github.com/specklesystems/speckle-qgis): QGIS connector
- [`speckle-powerbi`](https://github.com/specklesystems/speckle-powerbi): PowerBi connector
- and more [connectors & tooling](https://github.com/specklesystems/)!

## Developing and Debugging

Have you checked our [dev docs](https://speckle.guide/dev/)?

We have a detailed section on [deploying a Speckle server](https://speckle.guide/dev/server-setup.html). To get started developing locally, you can see the [Local development environment](https://speckle.guide/dev/server-local-dev.html) page.

### TL;DR;

We're using yarn and its workspaces functionalities to manage the monorepo.
Make sure you are using nodejs 16+.
To get started, run:

`$ corepack enable`
`$ yarn`
`$ yarn build`

After this, you can use the scripts in the individual packages or run all in dev mode:
`$ yarn dev`

For development you'll also want to run `yarn dev:docker:up` which will start up the docker containers you will need
to be able to run the apps on your machine.

### IDE

The suggested IDE for working in this repo is VSCode, because the repo has special configs to improve the DX there (auto-format & auto-lint, recommended extensions etc.).

This repository relies on [VSCode multi-root workspaces](https://code.visualstudio.com/docs/editor/multi-root-workspaces), so for the best DX and proper formatting/linting make sure you open the project using the `workspace.code-workspace` file instead of just opening the folder in VSCode.

### Useful containers

#### Maildev

We have a [Maildev](https://github.com/maildev/maildev) container available that you can use to see all e-mails sent out from the app. Make sure your `server` .env file is configured properly to use it:

```
EMAIL=true
EMAIL_FROM="speckle@speckle.local"
EMAIL_HOST="localhost"
EMAIL_PORT="1025"
```

The web portal is available at `localhost:1080` and it's listening for mail on port `1025`.

### Contributing

Please make sure you read the [contribution guidelines](https://github.com/specklesystems/speckle-server/blob/main/CONTRIBUTING.md) for an overview of the best practices we try to follow.

When pushing commits to this repo, please follow the following guidelines:

- When ready to commit, run `$ yarn cz` & follow the prompts.

When committing to git, an automated script will run. This will check that your commit conforms to Speckle's guidelines.

- To enable additional checks, you may wish to _optionally_ install the following:
  - [`pre-commit`](https://pre-commit.com/#install)
  - [`hadolint`](https://github.com/hadolint/hadolint#install)
  - [`shellcheck`](https://github.com/koalaman/shellcheck#installing)
  - [`helm`](https://helm.sh/docs/intro/install/)
- Please note that these additional checks will be run by Speckle's automated CI environment and non-conformances, if any, may prevent your Pull Request from being merged.
- Please use the name of the package as the scope of your commit.

### Security

For any security vulnerabilities or concerns, please contact us directly at security[at]speckle.systems.

### License

Unless otherwise described, the code in this repository is licensed under the Apache-2.0 License. Please note that some modules, extensions or code herein might be otherwise licensed. This is indicated either in the root of the containing folder under a different license file, or in the respective file's header. If you have any questions, don't hesitate to get in touch with us via [email](mailto:hello@speckle.systems).
