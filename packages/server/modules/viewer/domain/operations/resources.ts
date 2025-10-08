import type { SavedViewsLoadSettings } from '@/modules/core/graph/generated/graphql'
import type { ViewerResourceItem } from '@/modules/viewer/domain/types/resources'
import type { ExtendedViewerResourcesGraphQLReturn } from '@/modules/viewer/helpers/graphTypes'
import type { MaybeNullOrUndefined } from '@speckle/shared'

export type GetViewerResourceGroupsParams = {
  projectId: string
  /**
   * ID string for which to resolve resources
   */
  resourceIdString: string
  /**
   * Optionally resolve extra resources not in the resourceIdString. The returned resources
   * will specify if they are preload-only.
   */
  preloadResourceIdString?: MaybeNullOrUndefined<string>
  /**
   * By default if resourceIdString is set, the "versionId" part of model resource identifiers will be ignored
   * and all updates to of all versions of any of the referenced models will be returned. If `loadedVersionsOnly` is
   * enabled, then only updates of loaded/referenced versions in resourceIdString will be returned.
   */
  loadedVersionsOnly?: MaybeNullOrUndefined<boolean>

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
