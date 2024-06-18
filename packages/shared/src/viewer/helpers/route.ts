import { uniq, uniqBy } from '#lodash'

export enum ViewerResourceType {
  Model = 'Model',
  Object = 'Object',
  ModelFolder = 'ModelFolder',
  AllModels = 'all-models'
}

export interface ViewerResource {
  type: ViewerResourceType
  toString(): string
}

export class ViewerAllModelsResource implements ViewerResource {
  public type: ViewerResourceType = ViewerResourceType.AllModels

  toString(): string {
    return 'all'
  }
}

export class ViewerModelResource implements ViewerResource {
  public type: ViewerResourceType
  public modelId: string
  public versionId?: string

  constructor(modelId: string, versionId?: string) {
    this.type = ViewerResourceType.Model
    this.modelId = modelId
    this.versionId = versionId
  }

  toString(): string {
    return (
      this.versionId ? `${this.modelId}@${this.versionId}` : this.modelId
    ).toLowerCase()
  }
}

export class ViewerVersionResource extends ViewerModelResource {
  public versionId: string

  constructor(modelId: string, versionId: string) {
    super(modelId, versionId)
    this.versionId = versionId
  }

  toJSON() {
    return this.toString()
  }
}

export class ViewerObjectResource implements ViewerResource {
  public type: ViewerResourceType
  public objectId: string

  constructor(objectId: string) {
    this.type = ViewerResourceType.Object
    this.objectId = objectId
  }

  toString(): string {
    return this.objectId.toLowerCase()
  }
}

export class ViewerModelFolderResource implements ViewerResource {
  public type: ViewerResourceType
  public folderName: string

  constructor(folderName: string) {
    this.type = ViewerResourceType.ModelFolder
    this.folderName = folderName
  }

  toString(): string {
    return ('$' + this.folderName).toLowerCase()
  }
}

export function parseUrlParameters(resourceGetParam: string) {
  if (!resourceGetParam?.length) return []
  const parts = resourceGetParam.toLowerCase().split(',').sort()
  const resources: ViewerResource[] = []
  for (const part of parts) {
    if (part === 'all') {
      resources.push(new ViewerAllModelsResource())
    } else if (part.includes('@')) {
      const [modelId, versionId] = part.split('@')
      resources.push(new ViewerModelResource(modelId, versionId))
    } else if (part.startsWith('$')) {
      resources.push(new ViewerModelFolderResource(part.substring(1)))
    } else if (part.length === 32) {
      resources.push(new ViewerObjectResource(part))
    } else {
      resources.push(new ViewerModelResource(part))
    }
  }

  // Remove duplicates
  return uniqBy(resources, (r) => r.toString())
}

export function createGetParamFromResources(resources: ViewerResource[]) {
  const resourceParts = uniq(resources.map((r) => r.toString().toLowerCase())).sort()
  return resourceParts.join(',')
}

export const isAllModelsResource = (r: ViewerResource): r is ViewerAllModelsResource =>
  r.type === ViewerResourceType.AllModels

export const isModelResource = (r: ViewerResource): r is ViewerModelResource =>
  r.type === ViewerResourceType.Model

export const isObjectResource = (r: ViewerResource): r is ViewerObjectResource =>
  r.type === ViewerResourceType.Object

export const isModelFolderResource = (
  r: ViewerResource
): r is ViewerModelFolderResource => r.type === ViewerResourceType.ModelFolder

class ViewerResourceBuilder {
  #resources: ViewerResource[] = []

  addAllModels() {
    this.#resources.push(new ViewerAllModelsResource())
    return this
  }
  addModel(modelId: string, versionId?: string) {
    this.#resources.push(new ViewerModelResource(modelId, versionId))
    return this
  }
  addModelFolder(folderName: string) {
    this.#resources.push(new ViewerModelFolderResource(folderName))
    return this
  }
  addObject(objectId: string) {
    this.#resources.push(new ViewerObjectResource(objectId))
    return this
  }
  toString() {
    return createGetParamFromResources(this.#resources)
  }
  toResources() {
    return this.#resources.slice()
  }
  clear() {
    this.#resources = []
    return this
  }
}

/**
 * Fluent API for easier resource building
 */
export function resourceBuilder() {
  return new ViewerResourceBuilder()
}
