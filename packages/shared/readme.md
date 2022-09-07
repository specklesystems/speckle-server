# @speckle/shared

This package holds code that otherwise would be duplicated across @speckle packages, things like helpers, constants and TS types.

## Usage

### Peer dependencies

Some dependencies are marked as peer dependencies, to ensure that package consumers can manage their versions themselves. If you use any code from this package that relies on a specific peer dependency, make sure its installed.

### How to use

```js
import { Roles } from '@speckle/shared' // get main exports (from 'core')
import { isDocEmpty } from '@speckle/shared/dist/rich-text-editor' // get exports from sub-modules
```

## Development

Do `yarn build` to build or `yarn dev` to build in watch mode

### Code organization

The top-level index.ts should only export out important exports from other modules. Code should be organized according to areas of speckle, 'core' being the main one.
