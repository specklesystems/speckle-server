# The Speckle Frontend App

[![Twitter Follow](https://img.shields.io/twitter/follow/SpeckleSystems?style=social)](https://twitter.com/SpeckleSystems) [![Community forum users](https://img.shields.io/discourse/users?server=https%3A%2F%2Fspeckle.community&style=flat-square&logo=discourse&logoColor=white)](https://speckle.community) [![website](https://img.shields.io/badge/https://-speckle.systems-royalblue?style=flat-square)](https://speckle.systems) [![docs](https://img.shields.io/badge/docs-speckle.guide-orange?style=flat-square&logo=read-the-docs&logoColor=white)](https://speckle.guide/dev/)

## Disclaimer

We're working to stabilize the 2.0 API, and until then there will be breaking changes.

Note that this package contains two vue apps, the main frontend (located under @/main), and the viewer embed app (@/embed).

Notes:

- In **development** mode, the Speckle Server will proxy the frontend from `localhost:3000` to `localhost:8080`. If you don't see anything, ensure you've run `yarn serve` in the frontend package.

- In **production** mode, the Speckle Frontend will be statically served by nginx (see the Dockerfile in the current directory).

## Documentation

Comprehensive developer and user documentation can be found in our:

#### 📚 [Speckle Docs website](https://speckle.guide/dev/)

## Project setup

Make sure you follow the Developing and Debugging section in the project root readme.

### Running

Dev server with hot reload:

```
yarn dev
```

Build static build & serve it (for development, otherwise use docker image):

```
yarn build && yarn serve
```

### Apollo Client

We're on Apollo Client v3 and Vue Apollo v4 (both the options API and composition API) in this package, so pretty much all of the latest and greatest features are there and ready to be used.

**Note**: Do not import anything from `@apollo/client`, use `@apollo/client/core` instead! Otherwise you risk bundling in React dependencies, which we definitely do not need!

### TypeScript

This project also supports TypeScript, both in Vue SFCs and outside them. It's preferred that you use it when writing new code and also migrate JS files when there's a good oppurtunity to do so.

#### TS in Vue

1. Set `<script lang="ts">` in your .vue SFC
1. Make sure you do `export default defineComponent({...})` or `export default Vue.extend({...})` (or something else that is explicity typed to be a Vue component) not just `export default`, otherwise it's not clear to TS that the exported object is a Vue component
1. If Vetur reports incorrect errors, check this out: https://vuejs.github.io/vetur/guide/FAQ.html

Note: If you're defining a Vue component in a non-standard way (e.g. `vueWithMixins([]).extends({...})`), make sure you add a `// @vue/component` comment right above the Vue component object definition so that ESLint shows Vue appropriate linting rules, otherwise it won't.

#### Improved GraphQL DX w/ TS

Run `yarn gqlgen` to generate relevant TS types from the GraphQL Schema (introspected from server which must be running) and operations defined in the frontend. Afterwards make sure you import them from the generated `graphql.ts` file, not the original file where you defined the operation/fragment.

### Packaging for production

If you plan to package the frontend to use in a production setting, see our [Server deployment instructions](https://speckle.guide/dev/server-setup.html) (chapter `Run your speckle-server fork`)

### Troubleshooting

#### Vue TypeScript types get stuck in VSCode

Restart the Vetur Vue Language Server (VLS) through the command palette. Vetur is a bit janky and sometimes it gets stuck and isn't able to find new types/code.

#### Property 'xxx' does not exist on type 'CombinedVueInstance'

If you are getting a lot of Property 'xxx' does not exist on type 'CombinedVueInstance' errors, it's an issue with Vue's typing and TypeScript. You can work around it by annotating the return type for each computed/data property, making sure data/props keys are defined even if they're empty.

#### Vue Apollo Options API fetchMore() doesn't update the state/template quickly enough

This seems to be an issue that appeared after the Apollo Client v2 -> Apollo Client v3 upgrade. It only becomes an issue when you're trying to use vue-infinite-loader with fetchMore(), because the infinite loader triggers an infinite amount of requests with the old cursor, because the cursor hasn't been updated yet at that point.

The workaround is simple - use the Vue Apollo Composition API fetchMore

## Community

If in trouble, the Speckle Community hangs out on [the forum](https://speckle.community). Do join and introduce yourself! We're happy to help.

## License

Unless otherwise described, the code in this repository is licensed under the Apache-2.0 License. Please note that some modules, extensions or code herein might be otherwise licensed. This is indicated either in the root of the containing folder under a different license file, or in the respective file's header. If you have any questions, don't hesitate to get in touch with us via [email](mailto:hello@speckle.systems).
