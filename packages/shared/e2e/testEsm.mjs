import { isNullOrUndefined } from '@speckle/shared'

if (!isNullOrUndefined) {
  throw new Error('Could not process @speckle/shared ESM import')
}
