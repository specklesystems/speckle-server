import type {
  SavedViewsLoadSettings,
  ViewerUpdateTrackingTarget
} from '@/modules/core/graph/generated/graphql'
import type { ViewerResourceItem } from '@/modules/viewer/domain/types/resources'
import type { ExtendedViewerResourcesGraphQLReturn } from '@/modules/viewer/helpers/graphTypes'
import type { MaybeNullOrUndefined } from '@speckle/shared'

export type GetViewerResourceGroupsParams = ViewerUpdateTrackingTarget & {
  /**
   * By default this only returns groups w/ resources in them. W/ this flag set, it will also
   * return valid model groups that have no resources in them
   */
  allowEmptyModels?: boolean
  /**
   * Saved view being applied makes the resources be loaded differently
   */
  savedViewId?: MaybeNullOrUndefined<string>
  savedViewSettings?: MaybeNullOrUndefined<SavedViewsLoadSettings>
  /**
   * If true and no savedViewId specified, we'll resolve if there's an appropriate home view for
   * the specified resources and change the resourceIdString accordingly
   *
   * Default: false
   */
  applyHomeView?: boolean
}

export type GetViewerResourceGroups = (
  target: GetViewerResourceGroupsParams
) => Promise<ExtendedViewerResourcesGraphQLReturn>

export type GetViewerResourceItemsUngrouped = (
  target: GetViewerResourceGroupsParams
) => Promise<ViewerResourceItem[]>
