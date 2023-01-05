export enum ViewerResourceType {
  Model = 'Model',
  Object = 'Object'
}

export interface ViewerResource {
  type: ViewerResourceType
}

export class ModelResource implements ViewerResource {
  public type: ViewerResourceType
  public modelId: string
  public versionId?: string
  constructor(modelId: string, versionId?: string) {
    this.type = ViewerResourceType.Model
    this.modelId = modelId
    this.versionId = versionId
  }
}

export class ObjectResource implements ViewerResource {
  public type: ViewerResourceType
  public objectId: string
  constructor(objectId: string) {
    this.type = ViewerResourceType.Object
    this.objectId = objectId
  }
}

export function parseUrlParameters(params: string) {
  const parts = params.split(',')
  const resources = [] as ViewerResource[]
  for (const part of parts) {
    if (part.includes('@')) {
      const [modelId, versionId] = part.split('@')
      resources.push(new ModelResource(modelId, versionId))
    } else if (part.length === 32) {
      resources.push(new ObjectResource(part))
    } else {
      resources.push(new ModelResource(part))
    }
  }

  return resources
}

export function getObjectUrl(projectId: string, objectId: string) {
  const config = useRuntimeConfig()
  return `${config.public.apiOrigin}/streams/${projectId}/objects/${objectId}`
}

export function getPreviewUrl(projectId: string, resourceId: string) {
  const config = useRuntimeConfig()
  return `${config.public.apiOrigin}/preview/${projectId}/${
    resourceId.length === 32 ? 'objects' : 'commits'
  }/${resourceId}`
}
