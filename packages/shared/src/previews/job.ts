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
  duration: z.number(),
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
    reason: z.string()
  })
)

export const previewResultPayload = z.discriminatedUnion('status', [
  previewSuccessPayload,
  previewErrorPayload
])

export type PreviewResultPayload = z.infer<typeof previewResultPayload>
