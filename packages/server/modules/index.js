'use strict'
const fs = require('fs')
const path = require('path')
const { appRoot, repoRoot } = require('@/bootstrap')
const { values, merge, camelCase } = require('lodash')
const baseTypeDefs = require('@/modules/core/graph/schema/baseTypeDefs')
const { scalarResolvers } = require('./core/graph/scalars')

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

exports.init = async (app) => {
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
    './blobstorage'
  ]

  // Stage 1: initialise all modules
  for (const dir of moduleDirs) {
    await require(dir).init(app)
  }

  // Stage 2: finalize init all modules
  for (const dir of moduleDirs) {
    await require(dir).finalize(app)
  }
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
  const assetModuleDirs = fs.readdirSync(`${repoRoot}/assets`)
  assetModuleDirs.forEach((dir) => {
    const typeDefDirPath = path.join(`${repoRoot}/assets`, dir, 'typedefs')
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
