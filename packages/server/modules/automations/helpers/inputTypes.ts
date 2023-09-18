import { AutomationRunStatus } from '@/modules/core/graph/generated/graphql'
import { z } from 'zod'

const CurrentObjectResultsVersion = '1.0.0' as const

const SupportedObjectResultsVersions = [CurrentObjectResultsVersion] as const

const ObjectResultLevel = ['INFO', 'WARNING', 'ERROR'] as const

const ObjectResultLevelEnum = z.enum(ObjectResultLevel)

const ObjectResultValuesSchema = z.object({
  level: ObjectResultLevelEnum,
  statusMessage: z.string()
})

const FirstVersionResultsSchema = z.object({
  version: z.enum(SupportedObjectResultsVersions),
  values: z.object({
    speckleObjects: z.record(z.string(), ObjectResultValuesSchema.array()),
    blobIds: z.string().array().optional()
  })
})

export type FirstVersionResults = z.infer<typeof FirstVersionResultsSchema>

export type CurrentVersionResults = FirstVersionResults

// As new versions are added, add the type to this union
export type Results = FirstVersionResults // | SecondVersionResults | ThirdVersionResults

const FunctionRunStatusSchema = z
  .object({
    functionId: z.string().nonempty(),
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
  automationId: z.string().nonempty(),
  automationRevisionId: z.string().nonempty(),
  automationRunId: z.string().nonempty(),
  versionId: z.string().nonempty(),
  createdAt: z.date(),
  updatedAt: z.date(),
  functionRuns: z.array(FunctionRunStatusSchema).min(1)
})

export type AutomationRun = z.infer<typeof AutomationRunSchema>
