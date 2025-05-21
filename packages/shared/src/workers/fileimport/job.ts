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
      .default(20 * TIME.minute)
  })
)
export type JobPayload = z.infer<typeof jobPayload>

const baseFileImportResult = z.object({
  durationSeconds: z.number().describe('Duration to import the file, in seconds')
})

export type FileImportResult = z.infer<typeof baseFileImportResult>

const fileImportSuccessPayload = z.object({
  status: z.literal('success'),
  warnings: z.array(z.string()), //ok to be empty
  result: baseFileImportResult.merge(z.object({ versionId: z.string() }))
})

export type FileImportSuccessPayload = z.infer<typeof fileImportSuccessPayload>

const fileImportErrorPayload = z.object({
  status: z.literal('error'),
  reason: z.string(),
  result: baseFileImportResult
})

export type FileImportErrorPayload = z.infer<typeof fileImportErrorPayload>

export const fileImportResultPayload = z.discriminatedUnion('status', [
  fileImportSuccessPayload,
  fileImportErrorPayload
])

export type FileImportResultPayload = z.infer<typeof fileImportResultPayload>
