import {
  WorkspaceEvents,
  WorkspaceEventsPayloads,
  workspaceEventNamespace
} from '@/modules/workspaces/domain/events'
import { MaybeAsync } from '@speckle/shared'

import EventEmitter from 'eventemitter2'

type EventWildcard = '*'

// type EventNamespace = 'workspaces' | 'test'

// type EventNamesByNamespace<T extends EventNamespace> =
//   T extends 'test' ? 'foo' | 'bar'
//   : T extends 'workspaces' ? WorkspaceEvents : never

// type EventNamesByNamespace<T extends EventNamespace> = [T] extends ['workspaces'] ? WorkspaceEvents : [T] extends ['test'] ? 'foo' | 'bar' : never

type EventSubscriptionKey =
  | EventWildcard
  | `${keyof EventNamesByNamespace}.${EventWildcard}`
  | {
      [Namespace in keyof EventNamesByNamespace]: EventNamesByNamespace[Namespace]
    }[keyof EventNamesByNamespace]

// const x: EventSubscriptionKey = ''

// const x: EventNamesByNamespace['test'] = ''

type EventPayloadsByNamespace = {
  workspace: WorkspaceEventsPayloads
}

type EventPayload<T extends EventSubscriptionKey> = T extends EventWildcard
  ? /** All payloads */ unknown
  : T extends `${infer Namespace}.${EventWildcard}`
  ? Namespace extends keyof EventPayloadsByNamespace
    ? EventPayloadsByNamespace[Namespace][keyof EventPayloadsByNamespace[Namespace]]
    : never /** All playloads of namespace */
  : T extends `${infer Namespace}.${infer Event}`
  ? EventPayloadsByNamespace[Namespace extends keyof EventPayloadsByNamespace
      ? Namespace
      : never][`${Namespace}.${Event}` extends keyof EventPayloadsByNamespace[Namespace extends keyof EventPayloadsByNamespace
      ? Namespace
      : never]
      ? `${Namespace}.${Event}`
      : never]
  : never

// type EventNames<T extends EventNamespace> = T extends EventNamespace ? keyof WorkspaceEventsPayloads : never

// type EventSubscriptionKey<T> = [T] extends [EventNamespace] ? EventWildcard | `${T}.${EventWildcard}` | `${T}.${EventNamesByNamespace[T]}` : never

// const x: EventSubscriptionKey<'workspaces'> =

type EventName<T extends EventSubscriptionKey> = T extends EventWildcard
  ? unknown /** all event names */
  : T extends `${infer U}.${EventWildcard}`
  ? EventNamesByNamespace[U extends keyof EventNamesByNamespace
      ? U
      : never] /** all event names in namespace */
  : T /** Only provided key */

// type EventPayload<T extends EventSubscriptionKey, U = EventName<T>> = T extends

type EventNamesByNamespace = {
  test: 'foo' | 'bar'
  [workspaceEventNamespace]: WorkspaceEvents
}

const listen = <T extends EventSubscriptionKey>(
  eventKey: T,
  handler: (payload: EventPayload<T>, eventName: EventName<T>) => void
) => {
  // TODO
}

listen('*', (payload, eventName) => {})

listen('workspace.*', (payload, eventName) => {
  switch (eventName) {
    case 'workspace.created': {
      payload
    }
    case 'workspace.role-deleted': {
      payload
    }
  }
})

listen('workspace.created', (payload, eventName) => {})

export function initializeEventBus<P extends Record<string, unknown>>() {
  const emitter = new EventEmitter({ wildcard: true })

  return {
    /**
     * Emit a module event. This function must be awaited to ensure all listeners
     * execute. Any errors thrown in the listeners will bubble up and throw from
     * the part of code that triggers this emit() call.
     */
    emit: async <K extends keyof P & string>(
      eventName: K,
      payload: P[K] & { eventName: K }
    ): Promise<unknown[]> => {
      return emitter.emitAsync(eventName, payload)
    },

    /**
     * Listen for module events. Any errors thrown here will bubble out of where
     * emit() was invoked.
     *
     * @returns Callback for stopping listening
     */
    listen: <K extends EventSubscriptionKey>(
      eventName: K,
      // we should add some error type object here with a type discriminator
      handler: (
        payload: EventPayload<K>,
        eventName: EventName<K>
      ) => MaybeAsync<unknown>
    ) => {
      emitter.on(
        eventName,
        function (payload: EventPayload<K>) {
          return handler(payload, this.event)
        },
        {
          async: true,
          promisify: true
        }
      )

      return () => {
        emitter.removeListener(eventName, handler)
      }
    },

    /**
     * Destroy event emitter
     */
    destroy() {
      emitter.removeAllListeners()
    }
  }
}

type AllEventPayloads = WorkspaceEventsPayloads[keyof WorkspaceEventsPayloads]

type EventBusPayloads = WorkspaceEventsPayloads & { '*': AllEventPayloads }

type EventBus = ReturnType<typeof initializeEventBus<EventBusPayloads>>

let eventBus: EventBus

export function getEventBus(): EventBus {
  if (!eventBus) eventBus = initializeEventBus<EventBusPayloads>()
  return eventBus
}
