import type { Code, CodeKeywordDefinition, KeywordCxt } from 'ajv/dist/2020.js'
import { _, getProperty } from 'ajv/dist/compile/codegen/index.js'
import type { Plugin } from 'ajv/dist/2020.js'
import Ajv2020 from 'ajv/dist/2020.js'
import { Automate, MaybeNullOrUndefined } from '@speckle/shared'
import { JsonSchemaInputValidationError } from '@/modules/automate/errors/management'

type RedactionType = 'redactString' | 'redactNumber'

type Secret = (s: unknown) => unknown

const redaction: { [key in RedactionType]: Secret } = {
  redactString: (s: unknown) => {
    if (typeof s === 'string') return Automate.AutomateTypes.REDACTED_VALUE
    return s
  },
  redactNumber: (s: unknown) => {
    if (typeof s === 'number') return 0
    return s
  }
}

function getRedactionCodeKeywordDefinitionInternal(): CodeKeywordDefinition {
  return {
    keyword: 'writeOnly',
    schemaType: 'boolean',
    code: (cxt: KeywordCxt) => {
      const { gen, data, schema, it } = cxt
      const { parentData, parentDataProperty } = it
      const enabled: boolean = schema
      if (!enabled) return
      gen.if(_`typeof ${data} == "string" && ${parentData} !== undefined`, () => {
        gen.assign(data, redactExpr('redactString'))
        gen.assign(_`${parentData}[${parentDataProperty}]`, data)
      })
      gen.if(_`typeof ${data} == "number" && ${parentData} !== undefined`, () => {
        gen.assign(data, redactExpr('redactNumber'))
        gen.assign(_`${parentData}[${parentDataProperty}]`, data)
      })

      function redactExpr(t: string): Code {
        if (!(t in redaction)) throw new Error(`writeOnly: unknown redaction type ${t}`)
        const func = gen.scopeValue('func', {
          ref: redaction[t as RedactionType],
          code: _`require("ajv-keywords/dist/definitions/writeOnly").redaction${getProperty(
            t
          )}`
        })
        return _`${func}(${data})`
      }
    },
    metaSchema: {
      type: 'boolean'
    }
  }
}

const getRedactionCodeKeywordDefinition = Object.assign(
  getRedactionCodeKeywordDefinitionInternal,
  { writeOnly: redaction }
)

const ajvWriteOnlyRedactionPlugin: Plugin<undefined> = (ajv: Ajv2020): Ajv2020 => {
  const ajvWithRemovedKeyword = ajv.removeKeyword('writeOnly')
  return ajvWithRemovedKeyword.addKeyword(getRedactionCodeKeywordDefinition())
}

const ajvForRedaction = new Ajv2020({
  validateFormats: false,
  strict: false,
  validateSchema: false,
  strictSchema: false,
  strictNumbers: false,
  strictRequired: false,
  strictTuples: false,
  strictTypes: false,
  allowMatchingProperties: true
})
ajvWriteOnlyRedactionPlugin(ajvForRedaction) // side-effects apply the ajv plugin to redact data with writeOnly property

export const redactWriteOnlyInputData = (
  inputs: Record<string, unknown> | null,
  schema: MaybeNullOrUndefined<Record<string, unknown>>
): Record<string, unknown> | null => {
  if (!inputs) return inputs
  if (!schema) {
    throw new JsonSchemaInputValidationError('Schema is missing.')
  }
  const validatedData = ajvForRedaction.validate(schema, inputs)
  if (!validatedData) {
    throw new JsonSchemaInputValidationError(
      'Automation version input data does not match the expected schema for at least one Function.'
    )
  }
  ajvForRedaction.removeSchema() //removes all schema
  return inputs
}
