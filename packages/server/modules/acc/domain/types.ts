export type AccSyncItem = {
  id: string
  projectId: string
  modelId: string
  automationId: string
  accRegion: string
  accHubId: string
  accProjectId: string
  accRootProjectFolderUrn: string
  accFileLineageUrn: string
  accFileName: string
  accFileExtension: string
  accFileVersionIndex: number
  accFileVersionUrn: string
  accWebhookId?: string
  status: AccSyncItemStatus
  authorId: string
  createdAt: Date
  updatedAt: Date
}

export type AccSyncItemStatus =
  // A new file version had been detected, and we are awaiting a processable file.
  | 'PENDING'
  // We are actively processing the new file version. (The Automate function has been triggered.)
  | 'SYNCING'
  | 'FAILED'
  | 'PAUSED'
  | 'SUCCEEDED'

export type ModelDerivativeServiceDesignManifest = {
  type: 'manifest'
  region: string
  /* special base64 encoded */
  urn: string
  derivatives?: ModelDerivativeServiceDesignManifestDerivative[]
}

export type ModelDerivativeServiceDesignManifestDerivative = {
  name?: string
  status: 'pending' | 'inprogress' | 'success' | 'failed' | 'timeout'
  progress: 'complete' | `${number}%`
  outputType: AccDerivativeOutputType
  /** Sometimes `outputType` is "svf" and `overrideOutputType` is "svf2" */
  overrideOutputType?: string
}

export type AccRegion = 'US' | 'EMEA' | 'AUS' | 'CAN' | 'DEU' | 'IND' | 'JPN' | 'GBR'

export type AccDerivativeOutputType =
  | 'dwg'
  | 'fbx'
  | 'ifc'
  | 'iges'
  | 'obj'
  | 'step'
  | 'stl'
  | 'svf'
  | 'svf2'
  | 'thumbnail'
