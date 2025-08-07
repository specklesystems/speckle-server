import { SavedView } from './types.js'

export type GetSavedView = (args: {
  projectId: string
  savedViewId: string
}) => Promise<SavedView | null>
