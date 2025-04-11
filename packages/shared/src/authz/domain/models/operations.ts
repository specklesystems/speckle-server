import { Model } from './types.js'

export type GetModel = (args: {
  projectId: string
  modelId: string
}) => Promise<Model | null>
