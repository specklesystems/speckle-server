import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { loadNuxt, buildNuxt } from '@nuxt/kit'
import { isArray } from 'lodash'

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
 * @returns {Promise<{unimportOptions: import('unimport').UnimportOptions}>}
 */
export async function getNuxtModuleConfigs(nuxt) {
  const implicitModules = nuxt.options._modules

  // getting out unimport options:
  // only array module currently is the unimport one
  const arrayModule = implicitModules.find((m) => isArray(m))
  /** @type {import('@nuxt/schema').NuxtModule} */
  const nuxtModule = arrayModule[0]
  const options = await nuxtModule.getOptions()
  const presets = options.presets

  const [pagesModule] = implicitModules

  return {
    unimportOptions: {
      addons: { vueTemplate: true },
      imports: [],
      presets
    },
    pagesModule
  }
}

export async function integrateNuxtIntoStorybook() {
  const nuxt = await initializeNuxt()

  // Setting up hook where we will take out the final config and short-circuit the nuxt build
  /** @type {import('vite').InlineConfig} */
  let resolvedViteConfig = undefined
  nuxt.hook('vite:extend', (ctx) => {
    const { config } = ctx
    resolvedViteConfig = config

    // Throwing error to cancel actual bundling/building
    throw new BuildCancelationError('Canceling build')
  })

  try {
    // This triggers bundle() through which we can get the vite config
    // and also invokes all kinds of hooks that will configure component auto-import etc.
    await buildNuxt(nuxt)
  } catch (e) {
    if (!(e instanceof BuildCancelationError)) {
      throw e
    }
  }

  if (!resolvedViteConfig) {
    throw new Error("Couldn't resolve vite config")
  }

  // Calling hooks that will extend the config
  await nuxt.callHook('vite:extendConfig', resolvedViteConfig, {
    isClient: true,
    isServer: false
  })

  return { resolvedViteConfig, nuxt }
}
