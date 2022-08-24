'use strict'
const fs = require('fs')
const path = require('path')
const { appRoot, packageRoot } = require('@/bootstrap')
const { values, merge, camelCase } = require('lodash')
const baseTypeDefs = require('@/modules/core/graph/schema/baseTypeDefs')
const { scalarResolvers } = require('./core/graph/scalars')
const { modulesDebug } = require('@/modules/shared/utils/logger')

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

async function getSpeckleModules() {
  if (loadedModules.length) return loadedModules

  const moduleDirs = [
    './core',
    './auth',
    './apiexplorer',
    './emails',
    './pwdreset',
    './serverinvites',
    './previews',
    './fileuploads',
    './comments',
    './blobstorage',
    './notifications'
  ]

  for (const dir of moduleDirs) {
    loadedModules.push(require(dir))
  }

  return loadedModules
}

exports.init = async (app) => {
  const modules = await getSpeckleModules()
  const isInitial = !hasInitializationOccurred

  // Stage 1: initialise all modules
  for (const module of modules) {
    await module.init(app, isInitial)
  }

  // Stage 2: finalize init all modules
  for (const module of modules) {
    await module.finalize?.(app, isInitial)
  }

  hasInitializationOccurred = true
}

exports.shutdown = async () => {
  modulesDebug('Triggering module shutdown...')
  const modules = await getSpeckleModules()

  for (const module of modules) {
    await module.shutdown?.()
  }
  modulesDebug('...module shutdown finished')
}

/**
 * @returns {Pick<import('apollo-server-express').Config, 'resolvers' | 'typeDefs' | 'schemaDirectives'>}
 */
exports.graph = () => {
  // Base query and mutation to allow for type extension by modules.
  const typeDefs = [baseTypeDefs]

  let resolverObjs = []
  let schemaDirectives = {}

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
      schemaDirectives = Object.assign(...values(autoloadFromDirectory(directivesPath)))
    }
  })

  const resolvers = { ...scalarResolvers }
  resolverObjs.forEach((o) => {
    merge(resolvers, o)
  })

  return { resolvers, typeDefs, schemaDirectives }
}
