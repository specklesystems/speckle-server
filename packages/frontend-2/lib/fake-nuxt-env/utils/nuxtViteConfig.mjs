import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { loadNuxt } from '@nuxt/kit'
import { bundle } from '@nuxt/vite-builder'
import { isArray } from 'lodash'

/**
 * This script is a demo of how it's possible to get Nuxt's vite config
 */

const ROOT_DIRECTORY = resolve(dirname(fileURLToPath(import.meta.url)), '../../../')

class BuildCancelationError extends Error {}

/**
 * @returns {Promise<import('@nuxt/schema').Nuxt>}
 */
export async function initializeNuxt() {
  return await loadNuxt({
    overrides: {
      _generate: undefined
    },
    cwd: ROOT_DIRECTORY
  })
}

/**
 * @param {import('@nuxt/schema').Nuxt} nuxt
 * @returns {Promise<import('vite').InlineConfig>}
 */
export async function getNuxtViteConfig(nuxt) {
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

/**
 * @param {import('@nuxt/schema').Nuxt} nuxt
 * @returns {Promise<import('unimport').UnimportOptions>}
 */
export async function getNuxtUnimportConfig(nuxt) {
  const implicitModules = nuxt.options._modules

  // only array module currently is the unimport one
  const arrayModule = implicitModules.find((m) => isArray(m))

  /** @type {import('@nuxt/schema').NuxtModule} */
  const nuxtModule = arrayModule[0]
  const options = await nuxtModule.getOptions()
  const presets = options.presets

  return {
    addons: { vueTemplate: true },
    imports: [],
    presets
  }
}
