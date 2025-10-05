import { StringEnum, StringEnumValues } from '../../../core/helpers/utility.js'

export const SavedViewVisibility = StringEnum(['public', 'authorOnly'])
export type SavedViewVisibility = StringEnumValues<typeof SavedViewVisibility>

export type SavedView = {
  id: string
  name: string
  authorId: string | null
  groupId: string | null
  projectId: string
  visibility: SavedViewVisibility
  resourceIds: string[]
}

export type SavedViewGroup = {
  id: string
  projectId: string
  /**
   * null means default/ungrouped group
   */
  name: string | null
  authorId: string | null
  resourceIds: string[]
}
