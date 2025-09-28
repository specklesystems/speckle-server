import type { PartialDeep } from 'type-fest'
import {
  UnformattableResultsSchemaError,
  UnformattableTriggerDefinitionSchemaError
} from '../errors/index.js'
import { z } from 'zod'

export const TRIGGER_DEFINITIONS_SCHEMA_VERSION = 1.0
export const RESULTS_SCHEMA_VERSION = 1.0
export const REDACTED_VALUE = '******'

const versionCreatedTriggerDefinition = z.object({
  type: z.literal('VERSION_CREATED'),
  modelId: z.string()
})

export type VersionCreatedTriggerDefinition = z.infer<
  typeof versionCreatedTriggerDefinition
>

const triggerDefinitionsSchema = z.object({
  version: z.literal(1),
  definitions: z.array(versionCreatedTriggerDefinition)
})

export type TriggerDefinitionsSchema = z.infer<typeof triggerDefinitionsSchema>

const objectResultLevel = z.union([
  z.literal('SUCCESS'),
  z.literal('INFO'),
  z.literal('WARNING'),
  z.literal('ERROR')
])

export type ObjectResultLevel = z.infer<typeof objectResultLevel>

const objectResultCommon = z.object({
  category: z.string(),
  level: objectResultLevel,
  message: z.string().nullable(),
  metadata: z
    .intersection(
      z.object({
        gradient: z.boolean().optional(),
        gradientValues: z
          .record(z.string(), z.object({ gradientValue: z.number() }))
          .optional()
      }),
      z.record(z.string(), z.unknown())
    )
    .nullable(),
  visualOverrides: z.record(z.string(), z.unknown()).nullable()
})

const objectResultV1 = objectResultCommon.merge(
  z.object({
    objectIds: z.string().array()
  })
)

export const resultSchemaV1 = z.object({
  version: z.literal(1),
  values: z.object({
    objectResults: objectResultV1.array(),
    blobIds: z.string().array().optional()
  })
})

export type ResultSchemaV1 = z.infer<typeof resultSchemaV1>

const objectResultV2 = objectResultCommon.merge(
  z.object({
    objectAppIds: z.record(z.string(), z.string().nullable())
  })
)
export const resultSchemaV2 = z.object({
  version: z.literal(2),
  values: z.object({
    objectResults: objectResultV2.array(),
    blobIds: z.string().array().optional()
  })
})

export type ResultSchemaV2 = z.infer<typeof resultSchemaV2>

const versionResultV3 = z.record(z.string(), z.unknown())

export const resultSchemaV3 = z.object({
  version: z.literal(3),
  values: z.object({
    versionResult: versionResultV3.optional(),
    objectResults: objectResultV2.array().optional(),
    blobIds: z.string().array().optional()
  })
})

export type ResultSchemaV3 = z.infer<typeof resultSchemaV3>

export const resultSchema = z.discriminatedUnion('version', [
  resultSchemaV1,
  resultSchemaV2,
  resultSchemaV3
])

export type ResultsSchema = z.infer<typeof resultSchema>

type UnformattedTriggerDefinitionSchema = PartialDeep<TriggerDefinitionsSchema>
type UnformattedResultsSchema = PartialDeep<ResultsSchema>

export const isVersionCreatedTriggerDefinition = (
  val: unknown
): val is VersionCreatedTriggerDefinition => {
  const parseResult = versionCreatedTriggerDefinition.safeParse(val)
  return parseResult.success
}

export const isTriggerDefinitionSchema = (
  val: unknown
): val is TriggerDefinitionsSchema => {
  const parseResult = triggerDefinitionsSchema.safeParse(val)
  return parseResult.success
}

export const formatTriggerDefinitionSchema = (
  state: UnformattedTriggerDefinitionSchema
): TriggerDefinitionsSchema => {
  const parseResult = triggerDefinitionsSchema.safeParse(state)

  if (!parseResult.success) {
    throw new UnformattableTriggerDefinitionSchemaError(
      `Invalid trigger definition schema: ${parseResult.error}`
    )
  }
  return parseResult.data
}

export const isResultsSchema = (val: unknown): val is ResultsSchema => {
  const parseResult = resultSchema.safeParse(val)
  return parseResult.success
}

export const formatResultsSchema = (state: UnformattedResultsSchema): ResultsSchema => {
  const parseResult = resultSchema.safeParse(state)
  if (!parseResult.success) {
    throw new UnformattableResultsSchemaError(
      `Invalid results schema: ${parseResult.error}`
    )
  }
  return parseResult.data
}
