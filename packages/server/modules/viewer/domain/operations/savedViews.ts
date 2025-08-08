import type { Collection } from '@/modules/shared/helpers/dbHelper'
import type {
  SavedView,
  SavedViewGroup,
  SavedViewVisibility
} from '@/modules/viewer/domain/types/savedViews'
import type { MaybeNullOrUndefined, NullableKeysToOptional } from '@speckle/shared'
import type { SerializedViewerState } from '@speckle/shared/viewer/state'
import type { Exact, SetOptional } from 'type-fest'

/////////////////////
// REPO OPERATIONS:
/////////////////////

export type StoreSavedView = <
  View extends Exact<
    SetOptional<NullableKeysToOptional<SavedView>, 'id' | 'createdAt' | 'updatedAt'>,
    View
  >
>(params: {
  view: View
}) => Promise<SavedView>

export type StoreSavedViewGroup = <
  Group extends Exact<
    SetOptional<
      NullableKeysToOptional<SavedViewGroup>,
      'id' | 'createdAt' | 'updatedAt'
    >,
    Group
  >
>(params: {
  group: Group
}) => Promise<SavedViewGroup>

export type GetStoredViewCount = (params: { projectId: string }) => Promise<number>

export type GetProjectSavedViewGroupsBaseParams = {
  /**
   * Falsy means - anonymous user (so no onlyAuthored filtering)
   */
  userId?: MaybeNullOrUndefined<string>
  projectId: string
  resourceIdString: string
  onlyAuthored?: MaybeNullOrUndefined<boolean>
  search?: MaybeNullOrUndefined<string>
}

export type GetProjectSavedViewGroupsPageParams =
  GetProjectSavedViewGroupsBaseParams & {
    limit?: MaybeNullOrUndefined<number>
    cursor?: MaybeNullOrUndefined<string>
  }

export type GetProjectSavedViewGroupsPageItems = (
  params: GetProjectSavedViewGroupsPageParams
) => Promise<Omit<Collection<SavedViewGroup>, 'totalCount'>>

export type GetProjectSavedViewGroupsTotalCount = (
  params: GetProjectSavedViewGroupsBaseParams
) => Promise<number>

export type GetGroupSavedViewsBaseParams = {
  /**
   * Falsy means - anonymous user (so no onlyAuthored filtering)
   */
  userId?: MaybeNullOrUndefined<string>
  projectId: string
  groupResourceIdString: string
  /**
   * Null means a group w/ null id, undefined means - dont filter by group id at all
   */
  groupId: MaybeNullOrUndefined<string>
  onlyAuthored?: MaybeNullOrUndefined<boolean>
  search?: MaybeNullOrUndefined<string>
}

export type GetGroupSavedViewsPageParams = GetGroupSavedViewsBaseParams & {
  limit?: MaybeNullOrUndefined<number>
  cursor?: MaybeNullOrUndefined<string>
  sortDirection?: MaybeNullOrUndefined<'asc' | 'desc'>
  sortBy?: MaybeNullOrUndefined<'createdAt' | 'name' | 'updatedAt'>
}

export type GetGroupSavedViewsTotalCount = (
  params: GetGroupSavedViewsBaseParams
) => Promise<number>

export type GetGroupSavedViewsPageItems = (
  params: GetGroupSavedViewsPageParams
) => Promise<Omit<Collection<SavedView>, 'totalCount'>>

export type GetSavedViewGroup = (params: {
  id: string
  projectId: string
}) => Promise<SavedViewGroup | undefined>

export type GetUngroupedSavedViewsGroup = (params: {
  projectId: string
  resourceIdString: string
}) => SavedViewGroup

export type RecalculateGroupResourceIds = (params: {
  groupId: string
}) => Promise<SavedViewGroup | undefined>

/**
 * Get saved groups by IDs and their project IDs
 */
export type GetSavedViewGroups = (params: {
  groupIds: Array<{ groupId: string; projectId: string }>
}) => Promise<{
  [groupId: string]: SavedViewGroup | undefined
}>

export type GetSavedViews = (params: {
  viewIds: Array<{ viewId: string; projectId: string }>
}) => Promise<{
  [viewId: string]: SavedView | undefined
}>

export type GetSavedView = (params: {
  id: string
  projectId: string
}) => Promise<SavedView | undefined>

export type DeleteSavedViewRecord = (params: {
  savedViewId: string
}) => Promise<boolean>

export type UpdateSavedViewRecord = <
  Update extends Exact<Partial<SavedView>, Update>
>(params: {
  id: string
  projectId: string
  update: Update
}) => Promise<SavedView | undefined>

/////////////////////
// SERVICE OPERATIONS:
/////////////////////

export type CreateSavedViewParams = {
  input: {
    projectId: string
    resourceIdString: string
    groupId?: MaybeNullOrUndefined<string>
    name?: MaybeNullOrUndefined<string>
    description?: MaybeNullOrUndefined<string>
    /**
     * SerializedViewerState that will be validated/formatted before saving.
     */
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    viewerState: unknown | SerializedViewerState
    /**
     * Base64 encoded screenshot of the view.
     */
    screenshot: string
    isHomeView?: MaybeNullOrUndefined<boolean>
    visibility?: MaybeNullOrUndefined<SavedViewVisibility>
  }
  authorId: string
}

export type CreateSavedView = (params: CreateSavedViewParams) => Promise<SavedView>

export type CreateSavedViewGroupParams = {
  input: {
    projectId: string
    resourceIdString: string
    groupName: string
  }
  authorId: string
}

export type CreateSavedViewGroup = (
  params: CreateSavedViewGroupParams
) => Promise<SavedViewGroup>

export type GetProjectSavedViewGroups = (
  params: GetProjectSavedViewGroupsPageParams
) => Promise<Collection<SavedViewGroup>>

export type GetGroupSavedViews = (
  params: GetGroupSavedViewsPageParams
) => Promise<Collection<SavedView>>

export type DeleteSavedView = (params: {
  id: string
  projectId: string
  userId: string
}) => Promise<void>

export type UpdateSavedViewParams = {
  id: string
  projectId: string
  groupId?: MaybeNullOrUndefined<string>
  name?: MaybeNullOrUndefined<string>
  description?: MaybeNullOrUndefined<string>
  isHomeView?: MaybeNullOrUndefined<boolean>
  visibility?: MaybeNullOrUndefined<SavedViewVisibility>
  viewerState?: MaybeNullOrUndefined<unknown>
  resourceIdString?: MaybeNullOrUndefined<string>
  screenshot?: MaybeNullOrUndefined<string>
}

export type UpdateSavedView = (params: {
  input: UpdateSavedViewParams
  userId: string
}) => Promise<SavedView>
