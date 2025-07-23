import type { Collection } from '@/modules/shared/helpers/dbHelper'
import type {
  SavedView,
  SavedViewGroup,
  SavedViewVisibility
} from '@/modules/viewer/domain/types/savedViews'
import type { MaybeNullOrUndefined, NullableKeysToOptional } from '@speckle/shared'
import type { SerializedViewerState } from '@speckle/shared/viewer/state'
import type { SetOptional } from 'type-fest'

// REPO OPERATIONS:

export type StoreSavedView = (params: {
  view: SetOptional<NullableKeysToOptional<SavedView>, 'id' | 'createdAt' | 'updatedAt'>
}) => Promise<SavedView>

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
  resourceIdString: string
  groupName: MaybeNullOrUndefined<string>
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

// SERVICE OPERATIONS:

export type CreateSavedViewParams = {
  input: {
    projectId: string
    resourceIdString: string
    groupName?: MaybeNullOrUndefined<string>
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

export type GetProjectSavedViewGroups = (
  params: GetProjectSavedViewGroupsPageParams
) => Promise<Collection<SavedViewGroup>>

export type GetGroupSavedViews = (
  params: GetGroupSavedViewsPageParams
) => Promise<Collection<SavedView>>
