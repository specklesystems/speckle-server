import { Nullable } from '@speckle/shared'

export type GendoAIRenderRecord = {
  id: string
  userId: string
  projectId: string
  modelId: string
  versionId: string
  createdAt: Date
  updatedAt: Date
  gendoGenerationId: Nullable<string>
  status: string
  prompt: string
  camera: Record<string, unknown>
  /** References a blobId, weakly */
  baseImage: string
  /** References a blobId, weakly */
  responseImage: Nullable<string>
}
