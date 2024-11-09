/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from 'fs'
import path from 'path'
import { appRoot, packageRoot } from '@/bootstrap'
import { values, merge, camelCase, reduce, intersection } from 'lodash'
import baseTypeDefs from '@/modules/core/graph/schema/baseTypeDefs'
import { scalarResolvers } from '@/modules/core/graph/scalars'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { moduleLogger } from '@/logging/logging'
import { addMocksToSchema } from '@graphql-tools/mock'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { isNonNullable } from '@speckle/shared'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { Express } from 'express'
import { RequestDataLoadersBuilder } from '@/modules/shared/helpers/graphqlHelper'
import { ApolloServerOptions } from '@apollo/server'
import {
  GraphqlDirectiveBuilder,
  SchemaTransformer
} from '@/modules/core/graph/helpers/directiveHelper'
import { AppMocksConfig } from '@/modules/mocks'
import { SpeckleModuleMocksConfig } from '@/modules/shared/helpers/mocks'
import { LogicError } from '@/modules/shared/errors'

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
  fs.readdirSync(dirPath).forEach((file) => {
    const pathToFile = path.join(dirPath, file)
    const stat = fs.statSync(pathToFile)
    if (stat.isFile()) {
      const ext = path.extname(file)
      if (['.js', '.ts'].includes(ext)) {
        const name = camelCase(path.basename(file, ext))
        results[name] = require(pathToFile)
      }
    }
  })

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
    'multiregion'
  ]

  if (FF_AUTOMATE_MODULE_ENABLED) moduleNames.push('automate')
  if (FF_GENDOAI_MODULE_ENABLED) moduleNames.push('gendo')
  if (FF_WORKSPACES_MODULE_ENABLED) moduleNames.push('workspaces')
  if (FF_GATEKEEPER_MODULE_ENABLED) moduleNames.push('gatekeeper')
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

export const init = async (app: Express) => {
  const modules = await getSpeckleModules()
  const isInitial = !hasInitializationOccurred

  // Stage 1: initialise all modules
  for (const module of modules) {
    await module.init?.(app, isInitial)
  }

  // Stage 2: finalize init all modules
  for (const module of modules) {
    await module.finalize?.(app, isInitial)
  }

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

  // load code modules from /modules
  const codeModuleDirs = fs.readdirSync(`${appRoot}/modules`)
  codeModuleDirs.forEach((file) => {
    const fullPath = path.join(`${appRoot}/modules`, file)

    // load dataloaders
    const directivesPath = path.join(fullPath, 'graph', 'dataloaders')
    if (fs.existsSync(directivesPath)) {
      const newLoaders = values(autoloadFromDirectory(directivesPath))
        .map((l) => l.default)
        .filter(isNonNullable)

      dataLoaders = [...dataLoaders, ...newLoaders]
    }
  })

  return dataLoaders
}

/**
 * GQL components will be loaded even from disabled modules to avoid schema complexity, so ensure
 * that resolvers return valid values even if the module is disabled
 */
const graphComponents = (): Pick<ApolloServerOptions<any>, 'resolvers'> & {
  directiveBuilders: Record<string, GraphqlDirectiveBuilder>
  typeDefs: string[]
} => {
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
    const fullPath = path.join(`${appRoot}/modules`, file)

    // first pass load of resolvers
    const resolversPath = path.join(fullPath, 'graph', 'resolvers')
    if (fs.existsSync(resolversPath)) {
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
