import path from 'node:path'
import fs from 'node:fs/promises'
import { getESMDirname } from './eslint.config.mjs'
import { composer } from 'eslint-flat-config-utils'
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

    // Update glob patterns
    const formattedConfigs = configs.map((c, i) => {
      let name = `${namePrefix} #${i}`
      if (c.ignores) {
        name += ` (${c.ignores.length} ignore globs)`
      }
      if (c.files) {
        name += ` (${c.files.length} file globs)`
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

      const isGlobalIgnores = Object.keys(c).length === 1 && c.ignores

      if (isGlobalIgnores) {
        // Just update ignores, don't add files
        const ignores = c.ignores.map((i) => concatGlobPatterns(relativeContext, i))
        return {
          ignores,
          name
        }
      } else {
        const files = c.files
          ? c.files.map((f) => concatGlobPatterns(relativeContext, f))
          : [relativeContext]
        const ignores = c.ignores
          ? c.ignores.map((i) => concatGlobPatterns(relativeContext, i))
          : undefined

        return { ...c, files, ...(ignores ? { ignores } : {}), name }
      }
    })

    c.append(formattedConfigs)
  }

  const result = await c
  return result
}

export default buildConfigs()
