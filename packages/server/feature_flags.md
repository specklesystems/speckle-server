# Feature flags in the web stack

This document describes the recommended way to use of feature flags in our web stack.

## Flag management

At the moment for managing feature flags, we're relying on good old environment variables.
Currently we do not have a need to use an external flag managing service, but that might change in the future.

## Usage

The Speckle shared package exposes a `FeatureFlags` object, that contains all the available flags.

> ⚠️ Warning
> The feature flag mechanism doesn't work on the old frontend stack the same way.
> If you still need some of this functionality, the backend `serverInfo` graphql query is probably the best place to expose the value at.

### Backend, script usage

For any usecase that is not Nuxt based, the code below is the preferred way of using feature flags.

```typescript
import { Environment } from '@speckle/shared/dist/commonjs/environment/index' // or @speckle/shared/environment, if supported

if (Environment.getFeatureFlags().FF_AUTOMATE_MODULE_ENABLED)
  console.log("Hurray I'm enabled")
```

### Frontend usage

For our Nuxt based frontend we hook into Nuxt's config module to expose the feature flags in both SSR and frontend context.
So using the feature flag is the same as using any nuxt public runtime config value.

```typescript
const config = useRuntimeConfig()

if (config.public.FF_AUTOMATE_MODULE_ENABLED) console.log("Hurray I'm enabled")
```

You'll need to add these env vars manually in the `.env` files of all relevant packages. Note that in `frontend-2` and other Nuxt based packages, you'll need to prefix the env var with `NUXT_PUBLIC_`.

## Definition

The `@speckle/shared` package is the place where the common implementation of the feature flags is declared.
To add a new feature flag, you need to modify the `featureFlagSchema` zod definition in `./src/environment/index.ts`.

> 📣 Important
>
> Always add a default value, most probably `false` to the flag.
> This will ensure that the feature you areKeep in mind, in order to support adding doesn't automatically roll out to all our deployments

Once the flag is added to the zod schema, the flag is ready to be used in our apps.
To enable the specific feature, please add an environment variable to the `.env` file of the component.

> Note
>
> Since `znv` uses 1-1 name matching from the environment variables, we prefer using `MACRO_CASE` names.
> As a naming convention we've settled on prefixing the feature flags with `FF_`.
> After that, to provide some structure, the next word should categorize the flag into an app or module its meant to belong to. ie `FF_AUTOMATE_MODULE_ENABLED`.
> The names should also be declarative rather than imperative so that code like `if (FF_FLAG_NAME) { do something }` reads nicely.

## Deployment

With the use of `znv` we are directly parsing all environment variables into feature flags. So in general, all feature flags are just environment variables. We need to supply them to the application runtimes where they are needed.

### Locally

You'll need to add these env vars manually in the `.env` files of all relevant packages. Note that in `frontend-2` and other Nuxt based packages, you'll need to prefix the env var with `NUXT_PUBLIC_`

### Docker compose

This is less relevant nowadays, but practically it is a copy pasta exercise, each container definition declares env vars.

### Helm chart

Helm charts allow configurations via the chart `values.yaml` for this purpose (intentionally omitting secrets). The chart values file defines a `featureFlags` object, that should be extended with the newly added flag.

```yaml
## @section Feature flags
## @descriptionStart
## This object is a central location to define feature flags for the whole chart.
## @descriptionEnd
featureFlags:
  ## @param enableAutomateModule High level flag fully toggles the integrated automate module
  enableAutomateModule: false
```

To expose the flag to specific deployments, we need to add the value into each deployment's env array like so

```yaml
# ...
env:
  - name: ENABLE_AUTOMATE_MODULE
    // prettier-ignore
    value: {{ .Values.featureFlags.enableAutomateModule | quote }}
# ...
```
