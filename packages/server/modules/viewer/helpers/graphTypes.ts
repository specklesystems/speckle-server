import type {
  SavedView,
  SavedViewGroup
} from '@/modules/viewer/domain/types/savedViews'

export type SavedViewGraphQLReturn = SavedView
export type SavedViewGroupGraphQLReturn = SavedViewGroup
export type SavedViewPermissionChecksGraphQLReturn = { savedView: SavedView }
