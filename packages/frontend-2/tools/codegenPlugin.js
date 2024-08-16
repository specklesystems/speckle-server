const { reduce } = require('lodash')

/**
 * Expected usage:
 *
 * const userRef = getCacheId('User', id) // uses TypeMap to find the type
 * modifyObjectField(cache, userRef, field, ({value, variables}) => {
 *  // field name & value inferred from: TypeMap[TYPE][FIELD]
 *  // variables inferred from
 * })
 *
 * Needed types:
 * 1) All types in a map, should use existing object types:
 * type TypeMap = {
 *  Query: Query,
 *  User: User
 * }
 * 2) Field-variable map:
 *  type QueryVariablesFields = {
 *    user: {id: string}
 *  }
 *
 * type VariableMap = {
 *  Query: QueryVariablesFields,
 *  User: UserVariablesFields
 * }
 */

const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const formatName = (name) => {
  // Not sure why it gets converted this way in parent types
  return name.replace('AI', 'Ai')
}

/**
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
    output += `  ${typeName}: ${formatName(typeName)},\n`
  }
  output += `}\n`

  for (const [typeName, type] of Object.entries(objectTypeMap)) {
    const finalTypeName = formatName(typeName)

    output += `export type ${finalTypeName}FieldArgs = {\n`
    for (const [fieldName, fieldDef] of Object.entries(type.getFields())) {
      // const args = fieldDef.args
      // typeMapOut += `  ${fieldName}: `
      // if (!args.length) {
      //   typeMapOut += `[]`
      // } else {

      // }
      const argCount = fieldDef.args.length
      const argsName = formatName(`${finalTypeName}${capitalize(fieldName)}Args`)
      output += `  ${fieldName}: ${argCount ? argsName : '{}'},\n`
    }
    output += `}\n`
  }

  output += `export type AllObjectFieldArgTypes = {\n`
  for (const [typeName] of Object.entries(objectTypeMap)) {
    const finalTypeName = formatName(typeName)
    output += `  ${typeName}: ${finalTypeName}FieldArgs,\n`
  }
  output += `}\n`

  return `${output}\n`
}

module.exports = {
  plugin
}
