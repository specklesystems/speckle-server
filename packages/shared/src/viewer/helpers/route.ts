import { isString, uniq, uniqBy } from '#lodash'

export const ViewerResourceType = <const>{
  Model: 'Model',
  Object: 'Object',
  ModelFolder: 'ModelFolder',
  AllModels: 'all-models'
}
export type ViewerResourceType =
  (typeof ViewerResourceType)[keyof typeof ViewerResourceType]

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
    this.modelId = modelId.toLowerCase()
    this.versionId = versionId?.toLowerCase()
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
    this.versionId = versionId?.toLowerCase()
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
    this.objectId = objectId.toLowerCase()
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
    return '$' + this.folderName
  }
}

export const parseResourceFromString = (resourceId: string): ViewerResource => {
  if (resourceId === 'all') {
    return new ViewerAllModelsResource()
  } else if (resourceId.includes('@')) {
    const [modelId, versionId] = resourceId.split('@')
    return new ViewerVersionResource(modelId, versionId)
  } else if (resourceId.startsWith('$')) {
    return new ViewerModelFolderResource(resourceId.substring(1))
  } else if (resourceId.length === 32) {
    return new ViewerObjectResource(resourceId)
  } else {
    return new ViewerModelResource(resourceId)
  }
}

export function parseUrlParameters(resourceGetParam: string) {
  if (!resourceGetParam?.length) return []
  const parts = resourceGetParam
    .split(',')
    .filter((i) => i.trim().length)
    .sort()
  const resources: ViewerResource[] = []
  for (const part of parts) {
    const resource = parseResourceFromString(part)
    if (resource) {
      resources.push(resource)
    }
  }

  // Remove duplicates
  return uniqBy(resources, (r) => r.toString())
}

export function createGetParamFromResources(resources: ViewerResource[]) {
  const resourceParts = uniq(resources.map((r) => r.toString())).sort()
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

type StringViewerResourcesTarget = string | string[]
export type ViewerResourcesTarget =
  | ViewerResourceBuilder
  | ViewerResource[]
  | ViewerResource
  | StringViewerResourcesTarget

const toViewerResourceArray = (res: ViewerResourcesTarget): ViewerResource[] => {
  if (res instanceof ViewerResourceBuilder) {
    return res.toResources()
  }

  const fixString = (r: string | ViewerResource): ViewerResource[] =>
    isString(r) ? parseUrlParameters(r) : [r]

  if (Array.isArray(res)) {
    return res.flatMap(fixString)
  } else {
    return fixString(res)
  }
}

class ViewerResourceBuilder implements Iterable<ViewerResource> {
  #resources: ViewerResource[] = []

  #order() {
    this.#resources = uniq(this.#resources).sort()
  }

  addAllModels() {
    this.#resources.push(new ViewerAllModelsResource())
    this.#order()
    return this
  }
  addModel(modelId: string, versionId?: string) {
    this.#resources.push(new ViewerModelResource(modelId, versionId))
    this.#order()
    return this
  }
  addModelFolder(folderName: string) {
    this.#resources.push(new ViewerModelFolderResource(folderName))
    this.#order()
    return this
  }
  addObject(objectId: string) {
    this.#resources.push(new ViewerObjectResource(objectId))
    this.#order()
    return this
  }
  /**
   * @deprecated Use 'addResources' or 'addNew' instead
   */
  addFromString(stringResources: StringViewerResourcesTarget) {
    const strings = Array.isArray(stringResources) ? stringResources : [stringResources]
    for (const resourceIdString of strings) {
      const resources = parseUrlParameters(resourceIdString.toLowerCase())
      this.#resources.push(...resources)
    }

    this.#order()
    return this
  }
  addResources(res: ViewerResourcesTarget) {
    this.#resources.push(...toViewerResourceArray(res))
    this.#order()
    return this
  }

  /**
   * Only add those resources that are not already in the builder.
   */
  addNew(
    incoming: ViewerResourcesTarget,
    options?: {
      /**
       * If true, will require exact version matches for model resources
       * Default: false
       */
      requireExactMatch?: boolean
    }
  ) {
    const { requireExactMatch = false } = options || {}
    const resources = toViewerResourceArray(incoming)

    const newResources: ViewerResource[] = this.#resources.slice()
    for (const resource of resources) {
      // check if newResources has a resource w/ same modelId (check w/ isModelResource)
      if (isModelResource(resource) && !requireExactMatch) {
        const existing = newResources.find(
          (r) => isModelResource(r) && r.modelId === resource.modelId
        )
        if (!existing) {
          newResources.push(resource)
        }
      } else if (!newResources.some((r) => r.toString() === resource.toString())) {
        newResources.push(resource)
      }
    }

    this.#resources = newResources
    this.#order()

    return this
  }

  toString() {
    return createGetParamFromResources(this.#resources)
  }
  toResources() {
    return this.#resources.slice()
  }
  toResourceIds() {
    return this.toResources().map((r) => r.toString())
  }
  clear() {
    this.#resources = []
    return this
  }
  clone() {
    const clone = new ViewerResourceBuilder()
    const resources = this.toString()
    clone.addResources(resources)
    return clone
  }
  get length() {
    return this.#resources.length
  }

  /**
   * Remove specified versionIds from any model resources
   */
  clearVersions() {
    this.#resources.forEach((r) => {
      if (!isModelResource(r)) return
      r.versionId = undefined
    })
    return this
  }

  isEqualTo(resource: ViewerResourcesTarget) {
    const incomingBuilder = resourceBuilder().addResources(resource)
    return this.toString() === incomingBuilder.toString()
  }

  forEach(callback: (resource: ViewerResource) => void) {
    this.#resources.forEach(callback)
    return this
  }

  filter<Res extends ViewerResource>(
    callback: (resource: ViewerResource) => resource is Res
  ): Res[]
  filter(callback: (resource: ViewerResource) => boolean): ViewerResource[]
  filter(callback: (resource: ViewerResource) => boolean) {
    return this.#resources.filter(callback)
  }

  find<Res extends ViewerResource>(
    callback: (resource: ViewerResource) => resource is Res
  ): Res | undefined
  find(callback: (resource: ViewerResource) => boolean): ViewerResource | undefined
  find(callback: (resource: ViewerResource) => boolean) {
    return this.#resources.find(callback)
  }
  map<T>(callback: (resource: ViewerResource) => T): T[] {
    return this.#resources.map(callback)
  }
  [Symbol.iterator](): Iterator<ViewerResource> {
    return this.#resources[Symbol.iterator]()
  }
}

/**
 * Fluent API for easier resource building
 */
export function resourceBuilder() {
  return new ViewerResourceBuilder()
}

export type ResourceBuilder = ReturnType<typeof resourceBuilder>
