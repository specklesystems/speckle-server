import type { ExtendedViewerResourcesRequest } from '@/modules/core/graph/generated/graphql'
import type { ViewerResourceGroup } from '@/modules/viewer/domain/types/resources'
import type {
  SavedView,
  SavedViewGroup
} from '@/modules/viewer/domain/types/savedViews'
import type { MaybeNullOrUndefined } from '@speckle/shared'

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
