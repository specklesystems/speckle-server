/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  WorkspaceEventsPayloads,
  workspaceEventNamespace
} from '@/modules/workspacesCore/domain/events'
import type {
  gatekeeperEventNamespace,
  GatekeeperEventPayloads
} from '@/modules/gatekeeperCore/domain/events'
import type { MaybeAsync } from '@speckle/shared'
import type { UnionToIntersection } from 'type-fest'

import EventEmitter from 'eventemitter2'
import type {
  serverinvitesEventNamespace,
  ServerInvitesEventsPayloads
} from '@/modules/serverinvites/domain/events'
import type {
  modelEventsNamespace,
  ModelEventsPayloads
} from '@/modules/core/domain/branches/events'
import type {
  projectEventsNamespace,
  ProjectEventsPayloads
} from '@/modules/core/domain/projects/events'
import type {
  userEventsNamespace,
  UserEventsPayloads
} from '@/modules/core/domain/users/events'
import type {
  versionEventsNamespace,
  VersionEventsPayloads
} from '@/modules/core/domain/commits/events'
import type {
  accessRequestEventsNamespace,
  AccessRequestEventsPayloads
} from '@/modules/accessrequests/domain/events'
import type {
  commentEventsNamespace,
  CommentEventsPayloads
} from '@/modules/comments/domain/events'
import type {
  automationEventsNamespace,
  AutomationEventsPayloads,
  automationRunEventsNamespace,
  AutomationRunEventsPayloads
} from '@/modules/automate/domain/events'
import type {
  multiregionEventNamespace,
  MultiregionEventsPayloads
} from '@/modules/multiregion/domain/events'
import type {
  fileuploadEventNamespace,
  FileuploadEventsPayloads
} from '@/modules/fileuploads/domain/events'
import type {
  accSyncItemEventsNamespace,
  AccSyncItemEventsPayloads
} from '@/modules/acc/domain/acc/events'
import type {
  emailsEventNamespace,
  EmailsEventsPayloads
} from '@/modules/emails/domain/events'
import type {
  notificationsEventNamespace,
  NotificationsEventsPayloads
} from '@/modules/notifications/domain/events'
import type {
  savedViewsEventNamespace,
  SavedViewsEventsPayloads
} from '@/modules/viewer/domain/events/savedViews'

type AllEventsWildcard = '**'
type EventWildcard = '*'

export const TestEvents = {
  String: 'test.string',
  Number: 'test.number'
} as const

type TestEventsPayloads = {
  [TestEvents.String]: string
  [TestEvents.Number]: number
}

// we should only ever extend this type, other helper types will be derived from this
type EventsByNamespace = {
  test: TestEventsPayloads
  [accSyncItemEventsNamespace]: AccSyncItemEventsPayloads
  [workspaceEventNamespace]: WorkspaceEventsPayloads
  [gatekeeperEventNamespace]: GatekeeperEventPayloads
  [serverinvitesEventNamespace]: ServerInvitesEventsPayloads
  [modelEventsNamespace]: ModelEventsPayloads
  [projectEventsNamespace]: ProjectEventsPayloads
  [userEventsNamespace]: UserEventsPayloads
  [versionEventsNamespace]: VersionEventsPayloads
  [accessRequestEventsNamespace]: AccessRequestEventsPayloads
  [commentEventsNamespace]: CommentEventsPayloads
  [automationEventsNamespace]: AutomationEventsPayloads
  [automationRunEventsNamespace]: AutomationRunEventsPayloads
  [multiregionEventNamespace]: MultiregionEventsPayloads
  [fileuploadEventNamespace]: FileuploadEventsPayloads
  [emailsEventNamespace]: EmailsEventsPayloads
  [notificationsEventNamespace]: NotificationsEventsPayloads
  [savedViewsEventNamespace]: SavedViewsEventsPayloads
}

type EventTypes = UnionToIntersection<EventsByNamespace[keyof EventsByNamespace]>

// generated union to collect all event
type EventNamesByNamespace = {
  [Namespace in keyof EventsByNamespace]: keyof EventsByNamespace[Namespace]
}

// generated type for a top level wildcard one level nested wildcards per namespace and each possible event
type EventSubscriptionKey =
  | AllEventsWildcard
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

export type EventPayload<T extends EventSubscriptionKey> = T extends AllEventsWildcard
  ? // if event key is "**", get all events from the flat object
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

  const core = {
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

  // Extra utils
  const listenOnce = <K extends EventSubscriptionKey>(
    eventName: K,
    handler: (event: EventPayload<K>) => MaybeAsync<unknown>,
    options?: Partial<{
      /**
       * Timeout in milliseconds after which the listener will be removed even if it never fires
       * (useful in tests for cleanup)
       */
      timeout: number
    }>
  ) => {
    const removeListener = core.listen(eventName, async (event) => {
      try {
        await handler(event)
      } finally {
        removeListener()
      }
    })

    if (options?.timeout) {
      setTimeout(removeListener, options.timeout)
    }

    return removeListener
  }

  return {
    ...core,
    /**
     * Listen for module events only once. Any errors thrown here will bubble out of where
     * emit() was invoked.
     *
     * @returns Callback for stopping listening
     */
    listenOnce
  }
}

export type EventBus = ReturnType<typeof initializeEventBus>
export type EventBusPayloads = EventTypes
export type EventBusEmit = EventBus['emit']
export type EventBusListen = EventBus['listen']
export type EmitArg = Parameters<EventBusEmit>[0]

let eventBus: EventBus

export function getEventBus(): EventBus {
  if (!eventBus) eventBus = initializeEventBus()
  return eventBus
}

export const isSpecificEventPayload = <EventName extends EventNames>(
  payload: EventPayload<any>,
  eventKey: EventName
): payload is EventPayload<EventName> => {
  return payload.eventName === eventKey
}
