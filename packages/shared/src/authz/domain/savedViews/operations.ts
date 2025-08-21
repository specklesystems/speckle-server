import { SavedView, SavedViewGroup } from './types.js'

export type GetSavedView = (args: {
  projectId: string
  savedViewId: string
}) => Promise<SavedView | null>

export type GetSavedViewGroup = (args: {
  projectId: string
  groupId: string
}) => Promise<SavedViewGroup | null>
