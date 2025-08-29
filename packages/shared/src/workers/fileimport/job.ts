import z from 'zod'
import { TIME } from '../../core/index.js'

const job = z.object({
  jobId: z.string()
})

export const jobPayload = job.merge(
  z.object({
    serverUrl: z.string().url().describe('The url of the server'),
    projectId: z.string(),
    modelId: z.string(),
    token: z.string(),
    blobId: z.string(),
    fileType: z.string(),
    fileName: z.string(),
    timeOutSeconds: z
      .number()
      .int()
      .default(30 * TIME.minute)
      .describe('The timeout for a single attempt at parsing the file')
  })
)
export type JobPayload = z.infer<typeof jobPayload>

const baseFileImportResult = z.object({
  durationSeconds: z
    .number()
    .describe('Total duration to download & import the file, in seconds'),
  downloadDurationSeconds: z
    .number()
    .describe(
      'Duration to download the file, in seconds. This is a sub-component of the total duration.'
    ),
  parseDurationSeconds: z
    .number()
    .describe(
      'Duration to parse the file, in seconds. This is a sub-component of the total duration.'
    ),
  parser: z.string().describe('The parser used for the import')
})

export const JobResultStatus = {
  Error: 'error',
  Success: 'success'
} as const

export type FileImportResult = z.infer<typeof baseFileImportResult>

const fileImportSuccessPayload = z.object({
  status: z.literal(JobResultStatus.Success),
  warnings: z.array(z.string()), //ok to be empty
  result: baseFileImportResult.merge(z.object({ versionId: z.string() }))
})

export type FileImportSuccessPayload = z.infer<typeof fileImportSuccessPayload>

const fileImportErrorPayload = z.object({
  status: z.literal(JobResultStatus.Error),
  reason: z.string(),
  result: baseFileImportResult
})

export type FileImportErrorPayload = z.infer<typeof fileImportErrorPayload>

export const fileImportResultPayload = z.discriminatedUnion('status', [
  fileImportSuccessPayload,
  fileImportErrorPayload
])

export type FileImportResultPayload = z.infer<typeof fileImportResultPayload>

export type FileImportJobPayloadV1 = JobPayload & {
  jobType: 'fileImport'
  payloadVersion: 1
}
