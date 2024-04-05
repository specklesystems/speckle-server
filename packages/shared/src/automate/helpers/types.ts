import { get, intersection, isArray, isObjectLike } from 'lodash'
import type { PartialDeep } from 'type-fest'
import {
  UnformattableResultsSchemaError,
  UnformattableTriggerDefinitionSchemaError
} from '../errors'
import type { Nullable } from '../../core'

export const TRIGGER_DEFINITIONS_SCHEMA_VERSION = 1.0
export const RESULTS_SCHEMA_VERSION = 1.0

export type TriggerDefinitionsSchema = {
  version: number
  definitions: Array<{
    type: 'VERSION_CREATED'
    modelId: string
  }>
}

export type ResultsSchema = {
  version: number
  values: {
    objectResults: Record<
      string,
      {
        category: string
        level: 'INFO' | 'WARNING' | 'ERROR'
        objectIds: string[]
        message: Nullable<string>
        metadata: Nullable<Record<string, unknown>>
        visualoverrides: Nullable<Record<string, unknown>>
      }[]
    >
    blobIds?: string[]
  }
}

type UnformattedTriggerDefinitionSchema = PartialDeep<TriggerDefinitionsSchema>
type UnformattedResultsSchema = PartialDeep<ResultsSchema>

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

  return {
    version: state.version || throwInvalidError('version'),
    definitions: (state.definitions || throwInvalidError('definitions')).map((d) => {
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

  if (!isObjectLike(get(val, 'values.objectResults'))) return false
  if (get(val, 'values.blobIds') && !isArray(get(val, 'values.blobIds'))) return false

  return true
}

export const formatResultsSchema = (state: UnformattedResultsSchema): ResultsSchema => {
  const throwInvalidError = (missingPath: string): never => {
    throw new UnformattableResultsSchemaError(
      'Required data missing from ResultsSchema: ' + missingPath
    )
  }

  const values = state.values || throwInvalidError('values')
  if (!isObjectLike(values.objectResults)) {
    throw new UnformattableResultsSchemaError(
      'Invalid objectResults type. It should be a record.'
    )
  }

  return {
    version: state.version || throwInvalidError('version'),
    values: {
      objectResults: Object.entries(values.objectResults || {}).reduce(
        (acc, [key, value]) => {
          if (!isArray(value)) {
            throw new UnformattableResultsSchemaError(
              `Invalid objectResults entry for key: ${key}. It should be an array.`
            )
          }

          const objectResults = value.map((r) => {
            if (!isObjectLike(r)) {
              throw new UnformattableResultsSchemaError(
                `Invalid objectResults entry for key: ${key}`
              )
            }

            return {
              category:
                r.category || throwInvalidError('values.objectResults.category'),
              level: r.level || throwInvalidError('values.objectResults.level'),
              objectIds:
                r.objectIds || throwInvalidError('values.objectResults.objectIds'),
              message: r.message || null,
              metadata: r.metadata || null,
              visualoverrides: r.visualoverrides || null
            }
          })

          return {
            ...acc,
            [key]: objectResults
          }
        },
        {}
      ),
      blobIds: values.blobIds || undefined
    }
  }
}
