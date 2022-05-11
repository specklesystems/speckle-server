'use strict'
const fs = require('fs')
const path = require('path')
const { appRoot } = require('@/bootstrap')
const autoload = require('auto-load')
const { values, merge } = require('lodash')
const { scalarResolvers, scalarSchemas } = require('./core/graph/scalars')

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
    './comments'
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

exports.graph = () => {
  const dirs = fs.readdirSync(`${appRoot}/modules`)
  // Base query and mutation to allow for type extension by modules.
  const typeDefs = [
    `
      ${scalarSchemas}
      directive @hasScope(scope: String!) on FIELD_DEFINITION
      directive @hasScopes(scopes: [String]!) on FIELD_DEFINITION
      directive @hasRole(role: String!) on FIELD_DEFINITION

      type Query {
      """
      Stare into the void.
      """
        _: String
      }
      type Mutation{
      """
      The void stares back.
      """
      _: String
      }
      type Subscription{
        """
        It's lonely in the void.
        """
        _: String
      }`
  ]

  let resolverObjs = []
  let schemaDirectives = {}

  dirs.forEach((file) => {
    const fullPath = path.join(`${appRoot}/modules`, file)

    // load and merge the type definitions
    if (fs.existsSync(path.join(fullPath, 'graph', 'schemas'))) {
      const moduleSchemas = fs.readdirSync(path.join(fullPath, 'graph', 'schemas'))
      moduleSchemas.forEach((schema) => {
        typeDefs.push(
          fs.readFileSync(path.join(fullPath, 'graph', 'schemas', schema), 'utf8')
        )
      })
    }

    // first pass load of resolvers
    if (fs.existsSync(path.join(fullPath, 'graph', 'resolvers'))) {
      resolverObjs = [
        ...resolverObjs,
        ...values(autoload(path.join(fullPath, 'graph', 'resolvers')))
      ]
    }

    // load directives
    if (fs.existsSync(path.join(fullPath, 'graph', 'directives'))) {
      schemaDirectives = Object.assign(
        ...values(autoload(path.join(fullPath, 'graph', 'directives')))
      )
    }
  })

  const resolvers = { ...scalarResolvers }
  resolverObjs.forEach((o) => {
    merge(resolvers, o)
  })

  return { resolvers, typeDefs, schemaDirectives }
}
