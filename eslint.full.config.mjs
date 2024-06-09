import path from 'node:path'
import fs from 'node:fs/promises'
import { getESMDirname } from './eslint.config.mjs'
import { composer, extend } from 'eslint-flat-config-utils'
import { trim, trimStart } from 'lodash-es'

/**
 * This should be used when attempting to lint the entire monorepo. All other configs only lint their respective packages.
 */

const a = 1

const rootDir = getESMDirname(import.meta.url)
const rootConfigPath = path.join(rootDir, './eslint.config.mjs')

const concatGlobPatterns = (a, b) => {
  if (b.startsWith('!')) {
    a = '!' + trim(a, '!')
    b = trimStart(b, '!')
  }

  return path.join(a, b)
}

const findAllConfigPaths = async () => {
  // Iterate over all ./packages/* and get their configs
  // Get all folders inside ./packages
  const packages = (
    await fs.readdir(path.join(rootDir, './packages'), { withFileTypes: true })
  ).filter((d) => d.isDirectory())
  const configPaths = packages.map((d) => {
    const context = path.join(rootDir, './packages', d.name)
    const configFilePath = path.join(context, './eslint.config.mjs')
    const relativeContext = path.relative(rootDir, context)

    return { context, configFilePath, relativeContext }
  })

  return [
    ...configPaths,
    { configFilePath: rootConfigPath, context: rootDir, relativeContext: '.' }
  ]
}

const findAllConfigs = async () => {
  const paths = await findAllConfigPaths()

  const configs = await Promise.all(
    paths.map(async (p) => {
      /**
       * @type {Array<import('eslint').Linter.FlatConfig>}
       */
      const pathConfigs = await (await import(p.configFilePath)).default

      return {
        configs: pathConfigs,
        isRoot: p.configFilePath === rootConfigPath,
        ...p
      }
    })
  )

  // Put root first
  configs.sort((a) => (a.isRoot ? -1 : 1))
  return configs
}

const buildConfigs = async () => {
  const c = composer()
  const loadedConfigs = await findAllConfigs()

  for (const { relativeContext, configs, isRoot } of loadedConfigs) {
    const namePrefix = isRoot ? 'root' : relativeContext

    const extended = isRoot
      ? configs
      : await extend(
          // Make sure there's a files config of some kind (unless if global ignore)
          configs.map((c) => {
            const isGlobalIgnore = Object.keys(c).length === 1 && c.ignores
            if (isGlobalIgnore) return c

            return {
              ...c,
              files: c.files ? c.files : [`${relativeContext}/**/*`]
            }
          }),
          relativeContext
        )

    // Update glob patterns & names
    const formattedConfigs = extended.map((c, i) => {
      let name = `${namePrefix} #${i}`
      if (c.ignores) {
        name += ` (${c.ignores.length} ignore globs)`
      }
      if (c.files) {
        name += ` (${c.files.length} file globs)`
      }
      if (c.name) {
        name += ` - ${c.name}`
      }

      if (isRoot) {
        // Remove some ignores that would just ignore everything
        const ignores = c.ignores
          ? c.ignores.filter((i) => !i.startsWith('packages/'))
          : undefined
        return {
          ...c,
          ...(ignores ? { ignores } : {}),
          name
        }
      }

      return {
        ...c,
        name
      }
    })

    // Collect all plugins
    const plugins = formattedConfigs.reduce((acc, c) => {
      const plugins = c.plugins
      if (plugins) {
        return { ...acc, ...plugins }
      }

      return acc
    }, {})

    // Attempt to fill in missing plugins
    const fixedMissingPluginConfigs = formattedConfigs.map((c) => {
      const rules = c.rules
      if (!rules) return c

      const requiredPlugins = Object.keys(rules)
        .map((r) => {
          const [pluginName, ruleName] = r.split('/')
          if (!ruleName?.length) return null

          return pluginName
        })
        .filter((p) => !!p?.length)

      const newPlugins = {
        ...(c.plugins || {}),
        ...requiredPlugins.reduce((acc, p) => {
          const pluginDef = plugins[p]
          if (pluginDef) {
            acc[p] = pluginDef
          }

          return acc
        }, {})
      }

      return {
        ...c,
        ...(Object.keys(newPlugins).length ? { plugins: newPlugins } : {})
      }
    })

    c.append(fixedMissingPluginConfigs)
  }

  const result = await c
  return result
}

export default buildConfigs()
