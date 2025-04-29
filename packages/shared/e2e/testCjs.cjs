const { isNullOrUndefined } = require('@speckle/shared')

if (!isNullOrUndefined) {
  throw new Error('Could not process @speckle/shared CJS require')
}
