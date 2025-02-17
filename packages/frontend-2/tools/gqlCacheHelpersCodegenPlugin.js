const { reduce } = require('lodash')

const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const formatTsTypeName = (gqlTypeName) => {
  // Not sure why it gets converted this way in parent types
  return gqlTypeName.replace('AI', 'Ai')
}

/**
 * Plugin that adds some extra generated types and type mappings to support better Apollo Cache modification utilities
 * @type {import('@graphql-codegen/plugin-helpers').PluginFunction}
 */
const plugin = (schema) => {
  /** @type {Record<string, import('graphql').GraphQLNamedType>} */
  const objectTypeMap = reduce(
    schema.getTypeMap(),
    (acc, type, typeName) => {
      if (type.astNode?.kind === 'ObjectTypeDefinition') {
        acc[typeName] = type
      }
      return acc
    },
    {}
  )

  let output = `export type AllObjectTypes = {\n`
  for (const [typeName] of Object.entries(objectTypeMap)) {
    output += `  ${typeName}: ${formatTsTypeName(typeName)},\n`
  }
  output += `}\n`

  for (const [typeName, type] of Object.entries(objectTypeMap)) {
    const finalTypeName = formatTsTypeName(typeName)

    output += `export type ${finalTypeName}FieldArgs = {\n`
    for (const [fieldName, fieldDef] of Object.entries(type.getFields())) {
      const argCount = fieldDef.args.length
      const argsName = formatTsTypeName(`${finalTypeName}${capitalize(fieldName)}Args`)
      output += `  ${fieldName}: ${argCount ? argsName : '{}'},\n`
    }
    output += `}\n`
  }

  output += `export type AllObjectFieldArgTypes = {\n`
  for (const [typeName] of Object.entries(objectTypeMap)) {
    const finalTypeName = formatTsTypeName(typeName)
    output += `  ${typeName}: ${finalTypeName}FieldArgs,\n`
  }
  output += `}\n`

  return `${output}\n`
}

module.exports = {
  plugin
}
