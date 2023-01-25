import mitt from 'mitt'
import type {
  EventBusKeyPayloadMap,
  EventBusKeys
} from '~~/lib/core/composables/eventBus'

export default defineNuxtPlugin(() => {
  const emitter = mitt<EventBusKeyPayloadMap>()

  return {
    provide: {
      eventBus: {
        on: <T extends EventBusKeys>(
          key: T,
          handler: (event: EventBusKeyPayloadMap[T]) => void
        ) => emitter.on(key, handler),
        emit: <T extends EventBusKeys>(key: T, payload: EventBusKeyPayloadMap[T]) =>
          emitter.emit(key, payload)
      }
    }
  }
})
