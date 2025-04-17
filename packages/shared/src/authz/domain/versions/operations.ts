import { Version } from './types.js'

export type GetVersion = (args: {
  versionId: string
  projectId: string
}) => Promise<Version | null>
