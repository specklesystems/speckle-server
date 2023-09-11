import { AutomationRunStatus } from '@/modules/core/graph/generated/graphql'
import { z } from 'zod'

export type ModelAutomation = {
  projectId: string
  modelId: string
  automationId: string
  createdAt: Date
  automationRevisionId: string
  automationName: string
}

export const SupportedObjectResultsVersions = ['23.09'] as const

export const ObjectResultLevel = ['INFO', 'WARNING', 'ERROR'] as const

export const ObjectResultLevelEnum = z.enum(ObjectResultLevel)

export const ObjectResultValuesSchema = z.object({
  level: z.enum(['INFO', 'WARNING', 'ERROR']),
  statusMessage: z.string()
})

export const ObjectResultsSchema = z.object({
  version: z.enum(SupportedObjectResultsVersions),
  values: z.record(z.string(), ObjectResultValuesSchema.array())
})

export type ObjectResults = z.infer<typeof ObjectResultsSchema>

export const FunctionRunStatusSchema = z.object({
  functionId: z.string().nonempty(),
  elapsed: z.number(),
  runStatus: z.nativeEnum(AutomationRunStatus),
  contextView: z.string().nullable().default(null),
  resultVersionIds: z.string().array(),
  blobs: z.string().array(),
  statusMessage: z.string().nullable().default(null),
  objectResults: ObjectResultsSchema
})

export type FunctionRunStatus = z.infer<typeof FunctionRunStatusSchema>

export const AutomationRunSchema = z.object({
  automationId: z.string().nonempty(),
  automationRevisionId: z.string().nonempty(),
  automationRunId: z.string().nonempty(),
  versionId: z.string().nonempty(),
  createdAt: z.date(),
  updatedAt: z.date(),
  functionRunStatuses: z.array(FunctionRunStatusSchema)
})

export type AutomationRun = z.infer<typeof AutomationRunSchema>
