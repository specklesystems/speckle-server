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
  cameraLocation: Record<string, unknown>
  baseImage: string
  responseImage: string
}
