import type {
  FormSelectSavedView_SavedViewFragment,
  ViewerSavedViewsPanelViewDeleteDialog_SavedViewFragment,
  ViewerSavedViewsPanelViewEditDialog_SavedViewFragment,
  ViewerSavedViewsPanelViewMoveDialog_SavedViewFragment
} from '~/lib/common/generated/gql/graphql'
import type { SavedViewUrlSettings } from '~/lib/viewer/helpers/savedViews'

export enum ViewerEventBusKeys {
  ApplySavedView = 'UpdateSavedView',
  MarkSavedViewForEdit = 'MarkSavedViewForEdit',
  MarkSavedViewForEmbed = 'MarkSavedViewForEmbed',
  UserChangedOpenedView = 'UserChangedOpenedView'
}

export type ViewerSavedViewEventBusPayloads = {
  [ViewerEventBusKeys.ApplySavedView]: SavedViewUrlSettings
  [ViewerEventBusKeys.MarkSavedViewForEdit]:
    | {
        type: 'edit'
        view: ViewerSavedViewsPanelViewEditDialog_SavedViewFragment
      }
    | { type: 'move'; view: ViewerSavedViewsPanelViewMoveDialog_SavedViewFragment }
    | { type: 'delete'; view: ViewerSavedViewsPanelViewDeleteDialog_SavedViewFragment }
  [ViewerEventBusKeys.UserChangedOpenedView]: {
    viewId: string
  }
  [ViewerEventBusKeys.MarkSavedViewForEmbed]: {
    view: FormSelectSavedView_SavedViewFragment
  }
}

// Add mappings between event keys and expected payloads here
export type ViewerEventBusKeyPayloadMap = {
  [ViewerEventBusKeys.ApplySavedView]: ViewerSavedViewEventBusPayloads[ViewerEventBusKeys.ApplySavedView]
  [ViewerEventBusKeys.MarkSavedViewForEdit]: ViewerSavedViewEventBusPayloads[ViewerEventBusKeys.MarkSavedViewForEdit]
  [ViewerEventBusKeys.UserChangedOpenedView]: ViewerSavedViewEventBusPayloads[ViewerEventBusKeys.UserChangedOpenedView]
  [ViewerEventBusKeys.MarkSavedViewForEmbed]: ViewerSavedViewEventBusPayloads[ViewerEventBusKeys.MarkSavedViewForEmbed]
} & { [k in ViewerEventBusKeys]: unknown } & Record<string, unknown>
