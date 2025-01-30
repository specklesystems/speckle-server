import type { Angle, ObjectIdentifier } from '@/domain/domain.js'
import { isCastableToBrand } from '@/utils/brand.js'
import axios from 'axios'
import { z } from 'zod'

const previewResponseSchema = z.record(
  z.string().refine((value): value is Angle => isCastableToBrand<Angle>(value)),
  z.string()
)

export type GeneratePreview = (
  task: ObjectIdentifier
) => Promise<Record<Angle, string | undefined>>

export const generatePreviewFactory =
  ({
    serviceOrigin,
    timeout
  }: {
    serviceOrigin: string
    timeout: number
  }): GeneratePreview =>
  async (task: ObjectIdentifier) => {
    const previewUrl = `${serviceOrigin}/preview/${task.streamId}/${task.objectId}`
    const res = await axios.get(previewUrl, { timeout })
    const previewResponse = previewResponseSchema.parse(res.data)
    return previewResponse
  }
