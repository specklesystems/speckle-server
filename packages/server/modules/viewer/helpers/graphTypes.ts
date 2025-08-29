import type {
  ExtendedViewerResourcesRequest,
  ProjectSavedViewsUpdatedMessageType
} from '@/modules/core/graph/generated/graphql'
import type { ViewerResourceGroup } from '@/modules/viewer/domain/types/resources'
import type {
  SavedView,
  SavedViewGroup
} from '@/modules/viewer/domain/types/savedViews'
import type { MaybeNullOrUndefined, Nullable } from '@speckle/shared'

export type SavedViewGraphQLReturn = SavedView
export type SavedViewGroupGraphQLReturn = SavedViewGroup
export type SavedViewPermissionChecksGraphQLReturn = { savedView: SavedView }
export type SavedViewGroupPermissionChecksGraphQLReturn = {
  savedViewGroup: SavedViewGroup
}

export type ExtendedViewerResourcesGraphQLReturn = {
  groups: Array<ViewerResourceGroup>
  savedView?: MaybeNullOrUndefined<SavedView>
  request: ExtendedViewerResourcesRequest
  resourceIdString: string
}

export type ProjectSavedViewsUpdatedMessageGraphQLReturn = {
  type: ProjectSavedViewsUpdatedMessageType
  id: string
  projectId: string
  savedView: Nullable<SavedView>
}

export type ProjectSavedViewGroupsUpdatedMessageGraphQLReturn = {
  type: ProjectSavedViewsUpdatedMessageType
  id: string
  projectId: string
  savedViewGroup: Nullable<SavedViewGroup>
}
