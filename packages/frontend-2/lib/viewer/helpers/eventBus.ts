import type { SavedViewUrlSettings } from '~/lib/viewer/helpers/savedViews'

export enum ViewerEventBusKeys {
  UpdateSavedView = 'UpdateSavedView',
  SelectSavedViewGroup = 'SelectSavedViewGroup'
}

export type ViewerSavedViewEventBusPayloads = {
  [ViewerEventBusKeys.UpdateSavedView]: SavedViewUrlSettings
  [ViewerEventBusKeys.SelectSavedViewGroup]: { groupId: string }
}

// Add mappings between event keys and expected payloads here
export type ViewerEventBusKeyPayloadMap = {
  [ViewerEventBusKeys.UpdateSavedView]: ViewerSavedViewEventBusPayloads[ViewerEventBusKeys.UpdateSavedView]
  [ViewerEventBusKeys.SelectSavedViewGroup]: ViewerSavedViewEventBusPayloads[ViewerEventBusKeys.SelectSavedViewGroup]
} & { [k in ViewerEventBusKeys]: unknown } & Record<string, unknown>
