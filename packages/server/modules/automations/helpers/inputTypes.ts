import { AutomationRunStatus } from '@/modules/core/graph/generated/graphql'
import { z } from 'zod'

const CurrentObjectResultsVersion = '1.0.0' as const

const SupportedObjectResultsVersions = [CurrentObjectResultsVersion] as const

const ObjectResultLevel = ['INFO', 'WARNING', 'ERROR'] as const

const ObjectResultLevelEnum = z.enum(ObjectResultLevel)

const ObjectResultValuesSchema = z.object({
  level: ObjectResultLevelEnum,
  message: z.string().nullable(),
  category: z.string(),
  objectIds: z.string().array().nonempty(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  visualOverrides: z.record(z.string(), z.unknown()).nullable()
})

const FirstVersionResultsSchema = z.object({
  version: z.enum(SupportedObjectResultsVersions),
  values: z.object({
    objectResults: ObjectResultValuesSchema.array(),
    blobIds: z.string().array().optional()
  })
})

export type FirstVersionResults = z.infer<typeof FirstVersionResultsSchema>

export type CurrentVersionResults = FirstVersionResults

// As new versions are added, add the type to this union
export type Results = FirstVersionResults // | SecondVersionResults | ThirdVersionResults

const FunctionRunStatusSchema = z
  .object({
    functionId: z.string().min(1),
    functionName: z.string().min(1),
    functionLogo: z.string().nullable(),
    elapsed: z.number(),
    status: z.nativeEnum(AutomationRunStatus),
    contextView: z
      .string()
      .nullable()
      .default(null)
      .refine(
        (v) => {
          if (v === null) return true
          return !!/^\/projects\/[a-zA-Z0-9]+\/models\//i.exec(v)
        },
        { message: 'Invalid relative viewer URL' }
      ),
    resultVersionIds: z.string().array(),
    statusMessage: z.string().nullable().default(null),
    results: FirstVersionResultsSchema.nullable().default(null)
  })
  .refine(
    (schema) => {
      if (schema.status === AutomationRunStatus.Succeeded && !schema.results) {
        return false
      }

      return true
    },
    { message: 'Results must be provided for successful runs' }
  )

export const AutomationRunSchema = z.object({
  automationId: z.string().min(1),
  automationRevisionId: z.string().min(1),
  automationRunId: z.string().min(1),
  versionId: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  functionRuns: z.array(FunctionRunStatusSchema).min(1)
})

export type AutomationRun = z.infer<typeof AutomationRunSchema>
