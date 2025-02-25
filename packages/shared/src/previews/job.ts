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

const previewResult = z.object({
  durationSeconds: z.number().describe('Duration to generate the preview, in seconds'),
  screenshots: z.record(z.string(), z.string())
})

export type PreviewResult = z.infer<typeof previewResult>

const previewSuccessPayload = job.merge(
  z.object({
    status: z.literal('success'),
    result: previewResult
  })
)

export type PreviewSuccessPayload = z.infer<typeof previewSuccessPayload>

const previewErrorPayload = job.merge(
  z.object({
    status: z.literal('error'),
    reason: z.string(),
    result: z.object({
      durationSeconds: z
        .number()
        .describe('Duration spent processing the job before erroring, in seconds')
    })
  })
)

export const previewResultPayload = z.discriminatedUnion('status', [
  previewSuccessPayload,
  previewErrorPayload
])

export type PreviewResultPayload = z.infer<typeof previewResultPayload>
