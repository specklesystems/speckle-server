export type GendoAIRenderRecord = {
  id: string
  userId: string
  projectId: string
  modelId: string
  versionId: string
  createdAt: string
  updatedAt: string
  gendoGenerationId: string
  status: string
  prompt: string
  camera: Record<string, unknown>
  /** References a blobId, weakly */
  baseImage: string
  /** References a blobId, weakly */
  responseImage: string
}
