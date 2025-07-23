import type {
  SavedView,
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
