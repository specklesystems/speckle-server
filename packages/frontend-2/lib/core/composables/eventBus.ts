import type {
  ViewerEventBusKeyPayloadMap,
  ViewerEventBusKeys
} from '~/lib/viewer/helpers/eventBus'

export enum CoreEventBusKeys {
  TestKey = 'test_event_bus'
}

export type EventBusKeys = CoreEventBusKeys | ViewerEventBusKeys

// Add mappings between event keys and expected payloads here
export type EventBusKeyPayloadMap = {
  [CoreEventBusKeys.TestKey]: { foo: string; bar: string }
} & ViewerEventBusKeyPayloadMap & { [k in EventBusKeys]: unknown } & Record<
    string,
    unknown
  >

export function useEventBus() {
  const nuxt = useNuxtApp()
  const $eventBus = nuxt.$eventBus
  const handles = shallowRef<Array<() => void>>([])

  const on = <T extends EventBusKeys>(
    key: T,
    handler: (event: EventBusKeyPayloadMap[T]) => void
  ) => {
    $eventBus.on(key, handler)
    const offHandle = () => $eventBus.off(key, handler)
    handles.value = [...handles.value, offHandle]
    return offHandle
  }

  onUnmounted(() => {
    handles.value.forEach((quit) => quit())
    handles.value = []
  })

  return {
    /**
     * Event subscribe w/ automatic cleanup on unmount.
     * Returns a function to manually unsubscribe if needed.
     */
    on,
    emit: $eventBus.emit
  }
}
