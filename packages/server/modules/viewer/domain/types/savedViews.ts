import type { Nullable, StringEnumValues } from '@speckle/shared'
import { StringEnum } from '@speckle/shared'
import type { VersionedSerializedViewerState } from '@speckle/shared/viewer/state'

export const SavedViewVisibility = StringEnum(['public', 'authorOnly'])
export type SavedViewVisibility = StringEnumValues<typeof SavedViewVisibility>

export type SavedView = {
  id: string
  name: string
  description: Nullable<string>
  projectId: string
  /**
   * Null only if the author deleted their account
   */
  authorId: Nullable<string>
  groupName: Nullable<string>
  resourceIds: string[]
  isHomeView: boolean
  visibility: SavedViewVisibility
  viewerState: VersionedSerializedViewerState
  screenshot: string
  position: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Doesn't actually exist as a record in the DB, its dynamic and dependant on how it was retrieved
 */
export type SavedViewGroup = {
  /**
   * Composed out of groupName, projectId and resourceIdString, so it should be globally unique
   */
  id: string
  /**
   * Project that the group belongs to
   */
  projectId: string
  /**
   * Resource ids that were used to find the group
   */
  resourceIds: string[]
  /**
   * Null means default/unsorted group
   */
  name: Nullable<string>
}
