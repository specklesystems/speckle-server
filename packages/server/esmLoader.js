import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { register } from 'node:module'
import { appRoot, packageRoot } from './root.js'

/**
 * Must be invoked through --import when running the node app to set up path aliases
 * and extensionless imports
 */

/**
 * PATH ALIAS DEFINITIONS
 */
const aliases = {
  '@/': appRoot + '/',
  '#/': packageRoot + '/'
}

const packageAliases = {
  lodash: 'lodash-es'
}

/**
 * EXTENSIONS TO EVALUATE FOR EXTENSIONLESS IMPORTS
 */
const extensions = ['.js', '.mjs', '.cjs', '.json']

// Register the module hooks
register('./esmLoader.js', {
  parentURL: import.meta.url
})

// Custom path resolver
function resolveAlias(specifier) {
  for (const [alias, target] of Object.entries(aliases)) {
    if (specifier.startsWith(alias)) {
      const relativePath = specifier.replace(alias, target)
      return pathToFileURL(path.resolve(relativePath)).href
    }
  }
  for (const [alias, target] of Object.entries(packageAliases)) {
    if (specifier === alias) {
      return target
    }
  }
  return null // No alias found, fall back to default resolution
}

export async function resolve(specifier, context, nextResolve) {
  // Resolve alias
  const aliasResolved = resolveAlias(specifier)
  specifier = aliasResolved || specifier

  // Try to resolve as is
  let throwableError = undefined
  try {
    return await nextResolve(specifier)
  } catch (e) {
    throwableError = e
  }

  const isDirImport = throwableError.code === 'ERR_UNSUPPORTED_DIR_IMPORT'

  // Didn't work, try with extensions
  for (const ext of extensions) {
    try {
      return await nextResolve(specifier + ext)
    } catch (e) {
      if (!throwableError) {
        throwableError = e
      }
    }
  }

  // If it was a dir import also, try that with extensions
  specifier = isDirImport ? path.join(specifier, 'index') : specifier
  for (const ext of extensions) {
    try {
      return await nextResolve(specifier + ext)
    } catch (e) {
      if (!throwableError) {
        throwableError = e
      }
    }
  }

  throw throwableError
}

export { packageRoot, appRoot }
