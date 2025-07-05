import z from 'zod'

const JobIdSeparator = '.'

export const jobIdSchema = z
  .string()
  .refine((data) => data.split(JobIdSeparator).length === 2, {
    message: 'jobId must be in the format "projectId.objectId"'
  })

export const toJobId = (params: { projectId: string; objectId: string }): string => {
  return `${params.projectId}${JobIdSeparator}${params.objectId}`
}
export const fromJobId = (jobId: string): { projectId: string; objectId: string } => {
  return jobIdSchema
    .transform((data) => {
      return {
        projectId: data.split(JobIdSeparator)[0],
        objectId: data.split(JobIdSeparator)[1]
      }
    })
    .parse(jobId)
}

const job = z.object({
  jobId: jobIdSchema
})

export const jobPayload = job.merge(
  z.object({
    url: z.string().describe('The URL of the object to preview'),
    token: z
      .string()
      .describe('The authentication token to access the object and post the result'),
    responseUrl: z
      .string()
      .describe(
        'The URL to which the job result will be sent. This is typically a webhook endpoint'
      )
  })
)
export type JobPayload = z.infer<typeof jobPayload>

const previewPageResult = z.object({
  durationSeconds: z.number().describe('Duration to generate the preview, in seconds'),
  screenshots: z.record(z.string(), z.string())
})

const durationDetail = z.object({
  loadDurationSeconds: z
    .number()
    .describe('Duration to load the object from the server in seconds')
    .optional(),
  renderDurationSeconds: z
    .number()
    .describe('Duration to render the preview images in seconds')
    .optional()
})

const previewJobResult = previewPageResult.merge(durationDetail)

export type PreviewPageResult = z.infer<typeof previewPageResult>
export type PreviewJobResult = z.infer<typeof previewJobResult>

const previewSuccessPayload = job.merge(
  z.object({
    status: z.literal('success'),
    result: previewJobResult
  })
)

export type PreviewSuccessPayload = z.infer<typeof previewSuccessPayload>

const previewErrorPayload = job.merge(
  z.object({
    status: z.literal('error'),
    reason: z.string(),
    result: z
      .object({
        durationSeconds: z
          .number()
          .describe('Duration spent processing the job before erroring, in seconds')
      })
      .merge(durationDetail)
  })
)

export type PreviewErrorPayload = z.infer<typeof previewErrorPayload>

export const previewResultPayload = z.discriminatedUnion('status', [
  previewSuccessPayload,
  previewErrorPayload
])

export type PreviewResultPayload = z.infer<typeof previewResultPayload>
