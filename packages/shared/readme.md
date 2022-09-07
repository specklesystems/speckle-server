# @speckle/shared

This package holds code that otherwise would be duplicated across @speckle packages, things like helpers, constants and TS types.

## Usage

```js
import { Roles } from '@speckle/shared' // get important exports from main module entry point
import { isDocEmpty } from '@speckle/shared/rich-text-editor/helpers' // get exports from sub-modules
```

## Development

Do `yarn build` to build or `yarn dev` to build in watch mode

### Code organization

The top-level index.ts should only export out important exports from other modules. Code should be organized according to areas of speckle, 'core' being the main one.
