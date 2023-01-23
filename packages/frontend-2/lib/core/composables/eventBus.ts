export enum EventBusKeys {
  OnVersionPreviewGenerated = 'on_version_preview_generated'
}

export type EventBusKeyPayloadMap = {
  [EventBusKeys.OnVersionPreviewGenerated]: { versionId: string }
} & { [k in EventBusKeys]: unknown } & Record<string, unknown>

export function useEventBus() {
  const nuxt = useNuxtApp()
  return nuxt.$eventBus
}
