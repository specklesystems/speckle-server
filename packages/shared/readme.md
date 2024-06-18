# @speckle/shared

This package holds code that otherwise would be duplicated across @speckle packages, things like helpers, constants and TS types.

## Usage

### Peer dependencies

Some dependencies are marked as peer dependencies, to ensure that package consumers can manage their versions themselves. If you use any code from this package that relies on a specific peer dependency, make sure its installed.

### How to use

```js
import { Roles, RichTextEditor } from '@speckle/shared'
```

There are also "heavy" imports, that are not exported by default, like `@speckle/shared/environment`. These are used to avoid importing the whole package when only a small part of it is needed.
If export maps don't work (due to a legacy TS configuration) you can always import from `@speckle/shared/dist/**` directly

## Development

Do `yarn build` to build or `yarn dev` to build in watch mode

### Code organization

Code should be organized according to areas of speckle, 'core' being the main one. Exports from areas other than "core" should be grouped under namespaces like "RichTextEditor".
