import type { JsonSchema } from '@jsonforms/core'
import type { MaybeNullOrUndefined, Optional } from '@speckle/shared'
import { cloneDeep, get, isObjectLike, omit } from 'lodash-es'

export const formattedJsonFormSchema = (
  schema: MaybeNullOrUndefined<Record<string, unknown>>
): Optional<JsonSchema> => {
  if (!isObjectLike(schema)) return undefined
  if (!schema || !Object.values(schema).length) return undefined

  const finalizeSchema = (schema: Record<string, unknown>) =>
    omit(schema, ['$schema', '$id']) as JsonSchema

  const isTypeObject = get(schema, 'type') === 'object'
  if (isTypeObject) return finalizeSchema(schema)

  if (!('properties' in schema) || !isObjectLike(schema['properties'])) {
    return undefined
  }

  const finalSchema = finalizeSchema(schema)
  if (!Object.values(finalSchema.properties || {}).length) return undefined

  return finalSchema
}

export const formatJsonFormSchemaInputs = (
  inputs: MaybeNullOrUndefined<Record<string, unknown>>,
  schema: MaybeNullOrUndefined<JsonSchema>,
  options?: Partial<{ clone: boolean }>
) => {
  const { clone } = options || {}

  if (!inputs || !isObjectLike(inputs) || !Object.keys(inputs).length) {
    return schema?.type === 'object' ? {} : undefined
  }

  return clone ? cloneDeep(inputs) : inputs
}
