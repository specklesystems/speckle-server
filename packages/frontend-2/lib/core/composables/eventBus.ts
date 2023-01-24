export enum EventBusKeys {
  TestKey = 'test_event_bus'
}

// Add mappings between event keys and expected payloads here
export type EventBusKeyPayloadMap = {
  [EventBusKeys.TestKey]: { foo: string; bar: string }
} & { [k in EventBusKeys]: unknown } & Record<string, unknown>

export function useEventBus() {
  const nuxt = useNuxtApp()
  return nuxt.$eventBus
}
