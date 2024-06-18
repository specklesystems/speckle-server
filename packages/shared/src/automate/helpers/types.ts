import { get, has, intersection, isArray, isNumber, isObjectLike } from '#lodash'
import type { PartialDeep } from 'type-fest'
import {
  UnformattableResultsSchemaError,
  UnformattableTriggerDefinitionSchemaError
} from '../errors/index.js'
import type { Nullable } from '../../core/index.js'

export const TRIGGER_DEFINITIONS_SCHEMA_VERSION = 1.0
export const RESULTS_SCHEMA_VERSION = 1.0
export const REDACTED_VALUE = '******'

export type VersionCreatedTriggerDefinition = {
  type: 'VERSION_CREATED'
  modelId: string
}

export type TriggerDefinitionsSchema = {
  version: number
  definitions: Array<VersionCreatedTriggerDefinition>
}

export type ObjectResultLevel = 'INFO' | 'WARNING' | 'ERROR'

export type ResultsSchema = {
  version: number
  values: {
    objectResults: Array<{
      category: string
      level: ObjectResultLevel
      objectIds: string[]
      message: Nullable<string>
      metadata: Nullable<
        Record<string, unknown> & {
          gradient?: boolean
          gradientValues?: Record<string, { gradientValue: number }>
        }
      >
      visualoverrides: Nullable<Record<string, unknown>>
    }>
    blobIds?: string[]
  }
}

type UnformattedTriggerDefinitionSchema = PartialDeep<TriggerDefinitionsSchema>
type UnformattedResultsSchema = PartialDeep<ResultsSchema>

export const isVersionCreatedTriggerDefinition = (
  val: unknown
): val is VersionCreatedTriggerDefinition => {
  if (!val) return false
  if (!isObjectLike(val)) return false
  return get(val, 'type') === 'VERSION_CREATED' && has(val, 'modelId')
}

export const isTriggerDefinitionSchema = (
  val: unknown
): val is TriggerDefinitionsSchema => {
  if (!val) return false
  const keys: Array<keyof TriggerDefinitionsSchema> = ['version', 'definitions']
  if (!isObjectLike(val)) return false

  const valKeys = Object.keys(val as Record<string, unknown>)
  if (intersection(valKeys, keys).length !== keys.length) return false

  return true
}

export const formatTriggerDefinitionSchema = (
  state: UnformattedTriggerDefinitionSchema
): TriggerDefinitionsSchema => {
  const throwInvalidError = (missingPath: string): never => {
    throw new UnformattableTriggerDefinitionSchemaError(
      'Required data missing from TriggerDefinitionsSchema: ' + missingPath
    )
  }

  if (!isTriggerDefinitionSchema(state)) {
    throw new UnformattableTriggerDefinitionSchemaError(
      'Invalid trigger definition schema'
    )
  }

  const version = isNumber(state.version) ? state.version : throwInvalidError('version')
  return {
    version,
    definitions: (state.definitions || throwInvalidError('definitions')).map((d) => {
      if (!isObjectLike(d))
        throw new UnformattableTriggerDefinitionSchemaError(
          'Invalid non-object trigger definition'
        )

      switch (d.type || '') {
        case 'VERSION_CREATED':
          return {
            type: d.type,
            modelId: d.modelId || throwInvalidError('definitions.modelId')
          }
        default:
          throw new UnformattableTriggerDefinitionSchemaError(
            `Unknown trigger definition type: ${d.type}`
          )
      }
    })
  }
}

export const isResultsSchema = (val: unknown): val is ResultsSchema => {
  if (!val) return false
  const keys: Array<keyof ResultsSchema> = ['version', 'values']
  if (!isObjectLike(val)) return false

  const valKeys = Object.keys(val as Record<string, unknown>)
  if (intersection(valKeys, keys).length !== keys.length) return false

  if (!isArray(get(val, 'values.objectResults'))) return false
  if (get(val, 'values.blobIds') && !isArray(get(val, 'values.blobIds'))) return false

  return true
}

export const formatResultsSchema = (state: UnformattedResultsSchema): ResultsSchema => {
  const throwInvalidError = (missingPath: string): never => {
    throw new UnformattableResultsSchemaError(
      'Required data missing from ResultsSchema: ' + missingPath
    )
  }

  if (!isResultsSchema(state)) {
    throw new UnformattableResultsSchemaError('Invalid results schema')
  }

  const values = state.values || throwInvalidError('values')
  if (!isObjectLike(values.objectResults)) {
    throw new UnformattableResultsSchemaError(
      'Invalid objectResults type. It should be a record.'
    )
  }

  const version = isNumber(state.version) ? state.version : throwInvalidError('version')
  return {
    version,
    values: {
      objectResults: (values.objectResults || []).map((value, i) => {
        if (!isObjectLike(value)) {
          throw new UnformattableResultsSchemaError(
            `Invalid objectResults entry for index: ${i}. It should be a record.`
          )
        }

        return {
          category:
            value.category || throwInvalidError(`values.[${i}].objectResults.category`),
          level: value.level || throwInvalidError(`values.[${i}].objectResults.level`),
          objectIds:
            value.objectIds ||
            throwInvalidError(`values.[${i}].objectResults.objectIds`),
          message: value.message || null,
          metadata: value.metadata || null,
          visualoverrides: value.visualoverrides || null
        }
      }),
      blobIds: values.blobIds || undefined
    }
  }
}
