/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from 'fs'
import path from 'path'
import { appRoot, packageRoot } from '@/bootstrap'
import { values, merge, camelCase, reduce, intersection, difference } from 'lodash'
import baseTypeDefs from '@/modules/core/graph/schema/baseTypeDefs'
import { scalarResolvers } from '@/modules/core/graph/scalars'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { moduleLogger } from '@/observability/logging'
import { addMocksToSchema } from '@graphql-tools/mock'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { isNonNullable, Optional, Authz } from '@speckle/shared'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import type { Express } from 'express'
import { RequestDataLoadersBuilder } from '@/modules/shared/helpers/graphqlHelper'
import { ApolloServerOptions } from '@apollo/server'
import {
  GraphqlDirectiveBuilder,
  SchemaTransformer
} from '@/modules/core/graph/helpers/directiveHelper'
import { AppMocksConfig } from '@/modules/mocks'
import { SpeckleModuleMocksConfig } from '@/modules/shared/helpers/mocks'
import { LoaderConfigurationError, LogicError } from '@/modules/shared/errors'
import type { Registry } from 'prom-client'
import type { defineModuleLoaders } from '@/modules/loaders'
import {
  inMemoryCacheProviderFactory,
  wrapWithCache
} from '@/modules/shared/utils/caching'
import TTLCache from '@isaacs/ttlcache'

/**
 * Cached speckle module requires
 * */
const loadedModules: SpeckleModule[] = []

/**
 * Module init will be ran multiple times in tests, so it's useful for modules to know
 * when an initialization is a repeat one, so as to not introduce unnecessary resources/listeners
 */
let hasInitializationOccurred = false

function autoloadFromDirectory(dirPath: string) {
  if (!fs.existsSync(dirPath)) return

  const results: Record<string, any> = {}
  const files = fs.readdirSync(dirPath)
  for (const file of files) {
    const pathToFile = path.join(dirPath, file)
    const stat = fs.statSync(pathToFile)
    if (stat.isFile()) {
      const ext = path.extname(file)
      if (['.js', '.ts'].includes(ext)) {
        const name = camelCase(path.basename(file, ext))
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        results[name] = require(pathToFile)
      }
    }
  }

  return results
}

const getEnabledModuleNames = () => {
  const {
    FF_AUTOMATE_MODULE_ENABLED,
    FF_GENDOAI_MODULE_ENABLED,
    FF_WORKSPACES_MODULE_ENABLED,
    FF_GATEKEEPER_MODULE_ENABLED
  } = getFeatureFlags()
  const moduleNames = [
    'accessrequests',
    'activitystream',
    'apiexplorer',
    'auth',
    'blobstorage',
    'comments',
    'core',
    'cross-server-sync',
    'emails',
    'fileuploads',
    'notifications',
    'previews',
    'pwdreset',
    'serverinvites',
    'stats',
    'webhooks',
    'workspacesCore',
    'gatekeeperCore',
    'multiregion'
  ]

  if (FF_AUTOMATE_MODULE_ENABLED) moduleNames.push('automate')
  if (FF_GENDOAI_MODULE_ENABLED) moduleNames.push('gendo')
  // the order of the event listeners matters
  if (FF_GATEKEEPER_MODULE_ENABLED) moduleNames.push('gatekeeper')
  if (FF_WORKSPACES_MODULE_ENABLED) moduleNames.push('workspaces')
  return moduleNames
}

async function getSpeckleModules() {
  if (loadedModules.length) return loadedModules

  const moduleNames = getEnabledModuleNames()

  for (const dir of moduleNames) {
    const moduleIndex = await import(`./${dir}/index`)
    const moduleDefinition = 'init' in moduleIndex ? moduleIndex : moduleIndex.default
    if (!('init' in moduleDefinition)) {
      throw new LogicError(`Module ${dir} does not have an init function`)
    }

    loadedModules.push(moduleDefinition)
  }

  return loadedModules
}

export const init = async (params: { app: Express; metricsRegister: Registry }) => {
  const { app, metricsRegister } = params
  const modules = await getSpeckleModules()
  const isInitial = !hasInitializationOccurred

  // Stage 1: initialise all modules
  for (const module of modules) {
    await module.init?.({ app, isInitial, metricsRegister })
  }

  // Stage 2: finalize init all modules
  for (const module of modules) {
    await module.finalize?.({ app, isInitial, metricsRegister })
  }

  // Validate & cache authz loaders
  await moduleAuthLoaders()

  hasInitializationOccurred = true
}

export const shutdown = async () => {
  moduleLogger.info('Triggering module shutdown...')
  const modules = await getSpeckleModules()

  for (const module of modules) {
    await module.shutdown?.()
  }
  moduleLogger.info('...module shutdown finished')
}

/**
 * Autoloads dataloaders from all modules
 */
export const graphDataloadersBuilders = (): RequestDataLoadersBuilder<any>[] => {
  let dataLoaders: RequestDataLoadersBuilder<any>[] = []
  const enabledModuleNames = getEnabledModuleNames()

  // load code modules from /modules
  const codeModuleDirs = fs.readdirSync(`${appRoot}/modules`)
  codeModuleDirs.forEach((file) => {
    if (!enabledModuleNames.includes(file)) return
    const modulePath = path.join(`${appRoot}/modules`, file)

    // load dataloaders
    const fullPath = path.join(modulePath, 'graph', 'dataloaders')
    if (fs.existsSync(fullPath)) {
      const newLoaders = values(autoloadFromDirectory(fullPath))
        .map((l) => l.default)
        .filter(isNonNullable)

      dataLoaders = [...dataLoaders, ...newLoaders]
    }
  })

  return dataLoaders
}

/**
 * GQL components - typedefs, resolvers, directives
 * (assets & directives will be loaded from even disabled components cause the schema must be static)
 */
const graphComponents = (): Pick<ApolloServerOptions<any>, 'resolvers'> & {
  directiveBuilders: Record<string, GraphqlDirectiveBuilder>
  typeDefs: string[]
} => {
  const enabledModuleNames = getEnabledModuleNames()

  // Base query and mutation to allow for type extension by modules.
  const typeDefs = [baseTypeDefs]

  let resolverObjs: Array<Record<string, unknown>> = []
  let directiveBuilders = {}

  // load typedefs from /assets
  const assetModuleDirs = fs.readdirSync(`${packageRoot}/assets`)
  assetModuleDirs.forEach((dir) => {
    const typeDefDirPath = path.join(`${packageRoot}/assets`, dir, 'typedefs')
    if (fs.existsSync(typeDefDirPath)) {
      const moduleSchemas = fs.readdirSync(typeDefDirPath)
      moduleSchemas.forEach((schema) => {
        typeDefs.push(fs.readFileSync(path.join(typeDefDirPath, schema), 'utf8'))
      })
    }
  })

  // load code modules from /modules
  const codeModuleDirs = fs.readdirSync(`${appRoot}/modules`)
  codeModuleDirs.forEach((file) => {
    const isEnabledModule = enabledModuleNames.includes(file)
    const fullPath = path.join(`${appRoot}/modules`, file)

    // first pass load of resolvers
    const resolversPath = path.join(fullPath, 'graph', 'resolvers')
    if (isEnabledModule && fs.existsSync(resolversPath)) {
      const newResolverObjs = values(autoloadFromDirectory(resolversPath)).map((o) =>
        'default' in o ? o.default : o
      )
      resolverObjs = [...resolverObjs, ...newResolverObjs]
    }

    // load directives
    const directivesPath = path.join(fullPath, 'graph', 'directives')
    if (fs.existsSync(directivesPath)) {
      directiveBuilders = {
        ...directiveBuilders,
        ...reduce(
          values(autoloadFromDirectory(directivesPath)),
          (acc, directivesObj) => {
            return { ...acc, ...directivesObj }
          },
          {}
        )
      }
    }
  })

  const resolvers = { ...scalarResolvers }
  resolverObjs.forEach((o) => {
    merge(resolvers, o)
  })

  return { resolvers, typeDefs, directiveBuilders }
}

export const graphSchema = (mocksConfig?: AppMocksConfig) => {
  const { resolvers, typeDefs, directiveBuilders } = graphComponents()

  const directiveTypedefs: string[] = []
  const directiveSchemaTransformers: SchemaTransformer[] = []
  for (const directiveBuilder of Object.values(directiveBuilders)) {
    const { typeDefs, schemaTransformer } = directiveBuilder()
    directiveTypedefs.push(typeDefs)
    directiveSchemaTransformers.push(schemaTransformer)
  }

  // Init schema w/ base resolvers & typedefs
  let schema = makeExecutableSchema({
    resolvers,
    typeDefs: [...directiveTypedefs, ...typeDefs]
  })

  // Add mocks before directives intentionally (we still want auth checks to work for real)
  if (mocksConfig) {
    const { mockEntireSchema, mocks, resolvers } = mocksConfig
    if (mocks || mockEntireSchema) {
      schema = addMocksToSchema({
        schema,
        mocks: !mocks || mocks === true ? {} : mocks,
        preserveResolvers: !mockEntireSchema,
        resolvers
      })
    }
  }

  // Apply directives
  for (const schemaTransformer of directiveSchemaTransformers) {
    schema = schemaTransformer(schema)
  }

  return schema
}

/**
 * Load GQL mock configs from speckle modules
 */
export const moduleMockConfigs = (
  moduleWhitelist: string[]
): Record<string, SpeckleModuleMocksConfig> => {
  const enabledModuleNames = intersection(getEnabledModuleNames(), moduleWhitelist)

  // Config default exports keyed by module name
  const mockConfigs: Record<string, SpeckleModuleMocksConfig> = {}
  if (!enabledModuleNames.length) return mockConfigs

  // load code modules from /modules
  const codeModuleDirs = fs.readdirSync(`${appRoot}/modules`)
  codeModuleDirs.forEach((moduleName) => {
    const fullPath = path.join(`${appRoot}/modules`, moduleName)
    if (!enabledModuleNames.includes(moduleName)) return

    // load mock config
    const mocksFolderPath = path.join(fullPath, 'graph', 'mocks')
    if (fs.existsSync(mocksFolderPath)) {
      // We only take the first mocks.ts file we find (for now)
      const mainConfig = values(autoloadFromDirectory(mocksFolderPath))
        .map((l) => l.default)
        .filter(isNonNullable)[0]

      if (mainConfig && Object.values(mainConfig).length) {
        mockConfigs[moduleName] = mainConfig
      }
    }
  })

  return mockConfigs
}

export const moduleAuthLoaders = async () => {
  const enabledModuleNames = getEnabledModuleNames()

  let loaders: Partial<Authz.AuthCheckContextLoaders> = {}

  // load auth loaders from /modules and in same order as the whitelist
  const codeModuleDirs = fs.readdirSync(`${appRoot}/modules`)
  const coreModuleDirsOrdered = intersection(enabledModuleNames, codeModuleDirs)
  for (const moduleName of coreModuleDirsOrdered) {
    const fullModulePath = path.join(`${appRoot}/modules`, moduleName)
    const loadersFolderPath = path.join(fullModulePath, 'authz', 'loaders')
    if (!fs.existsSync(loadersFolderPath)) continue

    // We only take the first loaders.ts file we find (for now)
    const moduleLoadersBuilderFn = values(autoloadFromDirectory(loadersFolderPath))
      .map((l) => l.default)
      .filter(isNonNullable)[0] as Optional<ReturnType<typeof defineModuleLoaders>>

    loaders = {
      ...loaders,
      ...(await moduleLoadersBuilderFn?.())
    }
  }

  // validate that all were loaded
  const notFoundKeys = difference(
    Object.values(Authz.AuthCheckContextLoaderKeys),
    Object.keys(loaders)
  )
  if (notFoundKeys.length) {
    throw new LoaderConfigurationError(
      `Missing authz loaders found: ${notFoundKeys.join(', ')}`
    )
  }

  const allLoaders = loaders as Authz.AuthCheckContextLoaders

  /**
   * Add inmemory caching to all loaders. Since the loaders & their caches are scoped to each request and these checks
   * occur before any mutations, we can safely cache them in memory with a long ttl.
   *
   * In edge cases - the caches can be cleared
   */
  const cache = new TTLCache<string, unknown>()
  const loadersWithCache: Authz.AuthCheckContextLoaders = Object.entries(
    allLoaders
  ).reduce((acc, entry) => {
    const key = entry[0] as Authz.AuthCheckContextLoaderKeys
    const loader = entry[1] as Authz.AllAuthCheckContextLoaders[typeof key]

    const newLoader = wrapWithCache<any, any>({
      resolver: loader,
      name: `authzLoader:${key}`,
      // since its the inmemory cache, we dont have to worry about true-myth results being
      // serialized and deserialized as they would be with redis
      cacheProvider: inMemoryCacheProviderFactory({ cache }),
      ttlMs: 1000 * 60 * 60 // 1 hour (longer than any req will be)
    })
    acc[key] = newLoader

    return acc
  }, {} as Authz.AuthCheckContextLoaders)

  return {
    loaders: loadersWithCache,
    clearCache: () => cache.clear()
  }
}
