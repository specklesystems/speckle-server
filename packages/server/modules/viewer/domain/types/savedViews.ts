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
  groupId: Nullable<string>
  resourceIds: string[]
  isHomeView: boolean
  visibility: SavedViewVisibility
  viewerState: VersionedSerializedViewerState
  screenshot: string
  position: number
  createdAt: Date
  updatedAt: Date
}

export type SavedViewGroup = {
  /**
   * Globally unique identifier. If this is the default/unsorted group, the ID will be a static string and it represents a group
   * that doesn't actually exist in the database.
   */
  id: string
  /**
   * Null only if the author deleted their account or if default/unsorted group
   */
  authorId: Nullable<string>
  /**
   * Project that the group belongs to
   */
  projectId: string
  /**
   * Resource (model) ids associated w/ this group. This is kept in sync w/ all of the resourceIds for the views in this group too.
   */
  resourceIds: string[]
  /**
   * Null means default/unsorted group
   */
  name: Nullable<string>
  createdAt: Date
  updatedAt: Date
}
