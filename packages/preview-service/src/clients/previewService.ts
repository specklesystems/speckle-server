import type { ObjectIdentifier } from '@/domain/domain.js'

export type GeneratePreview = (
  task: ObjectIdentifier
) => Promise<Record<string, string>>

export const generatePreviewFactory =
  (deps: { serviceOrigin: string }): GeneratePreview =>
  async (task: ObjectIdentifier) => {
    const previewUrl = `${deps.serviceOrigin}/preview/${task.streamId}/${task.objectId}`
    const response = await fetch(previewUrl)
    // let imgBuffer = await res.buffer()  // this gets the binary response body
    //TODO parse into a more useful type
    return <Record<string, string>>await response.json()
  }
