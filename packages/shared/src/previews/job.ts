import z from 'zod'

const job = z.object({
  jobId: z.string()
})

export const jobPayload = job.merge(
  z.object({
    url: z.string(),
    token: z.string(),
    responseQueue: z.string()
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

export const previewResultPayload = z.discriminatedUnion('status', [
  previewSuccessPayload,
  previewErrorPayload
])

export type PreviewResultPayload = z.infer<typeof previewResultPayload>
