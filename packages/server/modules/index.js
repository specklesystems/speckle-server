const fs = require('fs')
const path = require('path')
const { appRoot, packageRoot } = require('@/bootstrap')
const { values, merge, camelCase, reduce, intersection } = require('lodash')
const baseTypeDefs = require('@/modules/core/graph/schema/baseTypeDefs')
const { scalarResolvers } = require('./core/graph/scalars')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const { moduleLogger } = require('@/logging/logging')
const { addMocksToSchema } = require('@graphql-tools/mock')
const { getFeatureFlags } = require('@/modules/shared/helpers/envHelper')
const { isNonNullable } = require('@speckle/shared')

/**
 * Cached speckle module requires
 * @type {import('@/modules/shared/helpers/typeHelper').SpeckleModule[]}
 * */
const loadedModules = []

/**
 * Module init will be ran multiple times in tests, so it's useful for modules to know
 * when an initialization is a repeat one, so as to not introduce unnecessary resources/listeners
 */
let hasInitializationOccurred = false

function autoloadFromDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return

  const results = {}
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
    FF_WORKSPACES_MODULE_ENABLED
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
    'workspacesCore'
  ]

  if (FF_AUTOMATE_MODULE_ENABLED) moduleNames.push('automate')
  if (FF_GENDOAI_MODULE_ENABLED) moduleNames.push('gendo')
  if (FF_WORKSPACES_MODULE_ENABLED) moduleNames.push('workspaces')
  return moduleNames
}

async function getSpeckleModules() {
  if (loadedModules.length) return loadedModules

  const moduleNames = getEnabledModuleNames()

  for (const dir of moduleNames) {
    loadedModules.push(require(`./${dir}`))
  }

  return loadedModules
}

exports.init = async (app) => {
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

exports.shutdown = async () => {
  moduleLogger.info('Triggering module shutdown...')
  const modules = await getSpeckleModules()

  for (const module of modules) {
    await module.shutdown?.()
  }
  moduleLogger.info('...module shutdown finished')
}

/**
 * Autoloads dataloaders from all modules
 * @returns {import('@/modules/shared/helpers/graphqlHelper').RequestDataLoadersBuilder<unknown>[]}
 */
exports.graphDataloadersBuilders = () => {
  let dataLoaders = []

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
 * @returns {Pick<import('@apollo/server').ApolloServerOptions, 'resolvers' | 'typeDefs'> & { directiveBuilders: Record<string, import('@/modules/core/graph/helpers/directiveHelper').GraphqlDirectiveBuilder>}}
 */
const graphComponents = () => {
  // Base query and mutation to allow for type extension by modules.
  const typeDefs = [baseTypeDefs]

  let resolverObjs = []
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
      resolverObjs = [...resolverObjs, ...values(autoloadFromDirectory(resolversPath))]
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

/**
 *
 * @param {import('@/modules/mocks').AppMocksConfig | undefined} [mocksConfig]
 * @returns
 */
exports.graphSchema = (mocksConfig) => {
  const { resolvers, typeDefs, directiveBuilders } = graphComponents()

  /** @type {string[]} */
  const directiveTypedefs = []
  /** @type {import('@/modules/core/graph/helpers/directiveHelper').SchemaTransformer[]} */
  const directiveSchemaTransformers = []
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
 * @param {string[]} moduleWhitelist
 * @returns {Record<string, import('@/modules/shared/helpers/mocks').SpeckleModuleMocksConfig>}
 */
exports.moduleMockConfigs = (moduleWhitelist) => {
  const enabledModuleNames = intersection(getEnabledModuleNames(), moduleWhitelist)

  // Config default exports keyed by module name
  const mockConfigs = {}
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
