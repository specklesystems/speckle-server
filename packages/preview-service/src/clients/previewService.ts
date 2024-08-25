import type { Angle, ObjectIdentifier } from '@/domain/domain.js'
import { isCastableToBrand } from '@/utils/brand.js'
import { z } from 'zod'

const previewResponseSchema = z.record(
  z.string().refine((value): value is Angle => isCastableToBrand<Angle>(value)),
  z.string()
)

export type GeneratePreview = (
  task: ObjectIdentifier
) => Promise<Record<Angle, string | undefined>>

export const generatePreviewFactory =
  (deps: { serviceOrigin: string }): GeneratePreview =>
  async (task: ObjectIdentifier) => {
    const previewUrl = `${deps.serviceOrigin}/preview/${task.streamId}/${task.objectId}`
    const response = await fetch(previewUrl)
    const responseBody: unknown = await response.json()
    const previewResponse = previewResponseSchema.parse(responseBody)
    return previewResponse
  }
