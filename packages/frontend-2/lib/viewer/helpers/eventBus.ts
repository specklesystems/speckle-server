import type { ViewerSavedViewEventBusPayloads } from '~/lib/viewer/helpers/savedViews'

export enum ViewerEventBusKeys {
  UpdateSavedView = 'aaa'
}

// Add mappings between event keys and expected payloads here
export type ViewerEventBusKeyPayloadMap = {
  [ViewerEventBusKeys.UpdateSavedView]: ViewerSavedViewEventBusPayloads[ViewerEventBusKeys.UpdateSavedView]
} & { [k in ViewerEventBusKeys]: unknown } & Record<string, unknown>
