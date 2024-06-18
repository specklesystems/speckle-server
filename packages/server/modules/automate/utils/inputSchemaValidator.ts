import { JsonSchemaInputValidationError } from '@/modules/automate/errors/management'
import Ajv2020 from 'ajv/dist/2020.js'

const ajv = new Ajv2020({
  validateFormats: false
})

export const validateInputAgainstFunctionSchema = (
  schema: Record<string, unknown> | null,
  inputs: Record<string, unknown> | null
) => {
  if (!schema && !inputs) return

  if (!schema) throw new JsonSchemaInputValidationError('Missing input schema')
  try {
    const isValid = ajv.validate(schema, inputs)
    if (!isValid) {
      throw new JsonSchemaInputValidationError("Input values don't match schema")
    }
  } catch {
    throw new JsonSchemaInputValidationError("Input values don't match schema")
  } finally {
    ajv.removeSchema() //clears ajv's cache to prevent collisions between similarly named schema
  }
}
