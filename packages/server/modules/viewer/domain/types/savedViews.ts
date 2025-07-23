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
