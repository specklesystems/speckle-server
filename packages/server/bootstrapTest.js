const Module = require('module')

// Define your custom extensions to attempt in order
const EXTENSIONS_TO_TRY = ['.js', '.ts', '/index.js', '/index.ts']
const aliases = ['@/', '#/']

// const originalLoad = Module._load
// Module._load = function (request, parent, isMain) {
//   const load = (newRequest) => originalLoad(newRequest || request, parent, isMain)
//   const isCannotFind = (e) => e.message.includes('Cannot find module')

//   const isOurAlias = aliases.some((alias) => request.startsWith(alias))
//   if (!isOurAlias) {
//     return load()
//   }

//   // Try as is
//   let throwableError = undefined
//   try {
//     const res = load()
//     return res
//   } catch (e) {
//     const cannotFindModule = isCannotFind(e)
//     if (!cannotFindModule || EXTENSIONS_TO_TRY.some((ext) => request.endsWith(ext))) {
//       throw e
//     }

//     throwableError = e
//   }

//   // Now lets see if we can resolve it with our custom extensions
//   for (const ext of EXTENSIONS_TO_TRY) {
//     try {
//       return load(request + ext)
//     } catch (e) {
//       if (!throwableError || !isCannotFind(e)) {
//         throwableError = e
//       }
//     }
//   }

//   throw throwableError || new Error('Fail')
// }

// Same version but with _resolveFilename
const originalResolveFilename = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  const load = (newRequest) =>
    originalResolveFilename(newRequest || request, parent, isMain, options)
  const isCannotFind = (e) => e.message.includes('Cannot find module')

  const isOurAlias = aliases.some((alias) => request.startsWith(alias))
  if (!isOurAlias) {
    return load()
  }

  // Try as is
  let throwableError = undefined
  try {
    const res = load()
    return res
  } catch (e) {
    const cannotFindModule = isCannotFind(e)
    if (!cannotFindModule || EXTENSIONS_TO_TRY.some((ext) => request.endsWith(ext))) {
      throw e
    }

    throwableError = e
  }

  // Now lets see if we can resolve it with our custom extensions
  for (const ext of EXTENSIONS_TO_TRY) {
    try {
      return load(request + ext)
    } catch (e) {
      if (!throwableError || !isCannotFind(e)) {
        throwableError = e
      }
    }
  }

  throw throwableError || new Error('Fail')
}
