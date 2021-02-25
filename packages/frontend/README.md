# The Speckle Frontend App

[![Twitter Follow](https://img.shields.io/twitter/follow/SpeckleSystems?style=social)](https://twitter.com/SpeckleSystems) [![Community forum users](https://img.shields.io/discourse/users?server=https%3A%2F%2Fdiscourse.speckle.works&style=flat-square&logo=discourse&logoColor=white)](https://discourse.speckle.works) [![website](https://img.shields.io/badge/https://-speckle.systems-royalblue?style=flat-square)](https://speckle.systems) [![docs](https://img.shields.io/badge/docs-speckle.guide-orange?style=flat-square&logo=read-the-docs&logoColor=white)](https://speckle.guide/dev/)

## Disclaimer

We're working to stabilize the 2.0 API, and until then there will be breaking changes.

Notes:

- In **development** mode, the Speckle Server will proxy the frontend from `localhost:8080` to `localhost:3000`. If you don't see anything, ensure you've run `npm run dev` in the frontend package.

- In **production** mode, the Speckle Server will statically serve the frontend app from `/dist`. You will need to run `npm run build` to populate this folder.

## Documentation

Comprehensive developer and user documentation can be found in our:

#### 📚 [Speckle Docs website](https://speckle.guide/dev/)

## Project setup

The frontend now includes the viewer. Until we get to publish it as a separate module, there's a few extra steps:

First, make sure you build the [Speckle Viewer](../viewer). Afterwards, run

```
lerna bootstrap
```

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

## Community

If in trouble, the Speckle Community hangs out on [the forum](https://discourse.speckle.works). Do join and introduce yourself! We're happy to help.

## License

Unless otherwise described, the code in this repository is licensed under the Apache-2.0 License. Please note that some modules, extensions or code herein might be otherwise licensed. This is indicated either in the root of the containing folder under a different license file, or in the respective file's header. If you have any questions, don't hesitate to get in touch with us via [email](mailto:hello@speckle.systems).
