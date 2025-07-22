import { Nullable } from '@speckle/shared'

export type ViewerResourceItem = {
  /** Null if resource represents an object */
  modelId?: Nullable<string>
  objectId: string
  /** Null if resource represents an object */
  versionId?: Nullable<string>
}

export type ViewerResourceGroup = {
  /** Resource identifier used to refer to a collection of resource items */
  identifier: string
  /** Viewer resources that the identifier refers to */
  items: Array<ViewerResourceItem>
}
