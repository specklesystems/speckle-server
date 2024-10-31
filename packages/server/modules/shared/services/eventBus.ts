import {
  WorkspaceEventsPayloads,
  workspaceEventNamespace
} from '@/modules/workspacesCore/domain/events'
import { MaybeAsync } from '@speckle/shared'
import { UnionToIntersection } from 'type-fest'

import EventEmitter from 'eventemitter2'
import {
  serverinvitesEventNamespace,
  ServerInvitesEventsPayloads
} from '@/modules/serverinvites/domain/events'

type EventWildcard = '*'

type TestEvents = {
  ['test.string']: string
  ['test.number']: number
}

// we should only ever extend this type, other helper types will be derived from this
type EventsByNamespace = {
  test: TestEvents
  [workspaceEventNamespace]: WorkspaceEventsPayloads
  [serverinvitesEventNamespace]: ServerInvitesEventsPayloads
}

type EventTypes = UnionToIntersection<EventsByNamespace[keyof EventsByNamespace]>

// generated union to collect all event
type EventNamesByNamespace = {
  [Namespace in keyof EventsByNamespace]: keyof EventsByNamespace[Namespace]
}

// generated type for a top level wildcard one level nested wildcards per namespace and each possible event
type EventSubscriptionKey =
  | EventWildcard
  | `${keyof EventNamesByNamespace}.${EventWildcard}`
  | {
      [Namespace in keyof EventNamesByNamespace]: EventNamesByNamespace[Namespace]
    }[keyof EventNamesByNamespace]

// generated flatten of each specific event name with the emitted event type
type EventPayloadsMap = UnionToIntersection<
  EventPayloadsByNamespaceMap[keyof EventPayloadsByNamespaceMap]
>

export type EventNames = keyof EventPayloadsMap

type EventPayloadsByNamespaceMap = {
  // for each event namespace
  [Key in keyof EventsByNamespace]: {
    // for each event
    [EventName in keyof EventsByNamespace[Key]]: {
      // create a type with they original event as the payload, and the eventName
      eventName: EventName
      payload: EventsByNamespace[Key][EventName]
    }
  }
}

type EventPayload<T extends EventSubscriptionKey> = T extends EventWildcard
  ? // if event key is "*", get all events from the flat object
    EventPayloadsMap[keyof EventPayloadsMap]
  : // else if, the key is a "namespace.*" wildcard
  T extends `${infer Namespace}.${EventWildcard}`
  ? // the Namespace needs to extend the keys of the type, otherwise we never
    Namespace extends keyof EventPayloadsByNamespaceMap
    ? // get the union type of all possible events in a namespace
      EventPayloadsByNamespaceMap[Namespace][keyof EventPayloadsByNamespaceMap[Namespace]]
    : never
  : // else if, the key is a "namespace.event" concrete key
  T extends keyof EventPayloadsMap
  ? EventPayloadsMap[T]
  : never

export function initializeEventBus() {
  const emitter = new EventEmitter({ wildcard: true })

  return {
    /**
     * Emit a module event. This function must be awaited to ensure all listeners
     * execute. Any errors thrown in the listeners will bubble up and throw from
     * the part of code that triggers this emit() call.
     */
    emit: async <EventName extends EventNames>(args: {
      eventName: EventName
      payload: EventTypes[EventName]
    }): Promise<void> => {
      // curate the proper payload here and eventName object here, before emitting
      await emitter.emitAsync(args.eventName, args)
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
      handler: (event: EventPayload<K>) => MaybeAsync<unknown>
    ) => {
      emitter.on(eventName, handler, {
        async: true,
        promisify: true
      })

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

export type EventBus = ReturnType<typeof initializeEventBus>
export type EventBusPayloads = EventTypes
export type EventBusEmit = EventBus['emit']
export type EmitArg = Parameters<EventBusEmit>[0]

let eventBus: EventBus

export function getEventBus(): EventBus {
  if (!eventBus) eventBus = initializeEventBus()
  return eventBus
}
