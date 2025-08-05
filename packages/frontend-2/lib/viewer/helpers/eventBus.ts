export enum ViewerEventBusKeys {
  UpdateSavedView = 'aaa'
}

// Add mappings between event keys and expected payloads here
export type ViewerEventBusKeyPayloadMap = {
  [ViewerEventBusKeys.UpdateSavedView]: { viewId?: string }
} & { [k in ViewerEventBusKeys]: unknown } & Record<string, unknown>
