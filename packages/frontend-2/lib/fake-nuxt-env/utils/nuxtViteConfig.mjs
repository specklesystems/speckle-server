import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

import { loadNuxt } from '@nuxt/kit'
import { bundle } from '@nuxt/vite-builder'

/**
 * This script is a demo of how it's possible to get Nuxt's vite config
 */

const ROOT_DIRECTORY = resolve(dirname(fileURLToPath(import.meta.url)), '../../../')

class BuildCancelationError extends Error {}

/**
 * @returns {Promise<import('vite').InlineConfig>}
 */
export async function getNuxtViteConfig() {
  const nuxt = await loadNuxt({
    overrides: {
      _generate: undefined
    },
    cwd: ROOT_DIRECTORY
  })

  let resolvedViteConfig = undefined
  nuxt.hook('vite:extend', (ctx) => {
    const { config } = ctx
    resolvedViteConfig = config

    // Throwing error to cancel actual bundling/building
    throw new BuildCancelationError('Canceling build')
  })

  try {
    await bundle(nuxt)
  } catch (e) {
    if (!(e instanceof BuildCancelationError)) {
      throw e
    }
  }

  if (!resolvedViteConfig) {
    throw new Error("Couldn't resolve vite config")
  }

  return resolvedViteConfig
}
