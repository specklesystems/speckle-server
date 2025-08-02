import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import { ViewerUserActivityStatus } from '~~/lib/common/generated/gql/graphql'
import type {
  OnViewerUserActivityBroadcastedSubscription,
  ViewerUserActivityMessageInput
} from '~~/lib/common/generated/gql/graphql'
import {
  useInjectedViewerInterfaceState,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import type { InjectableViewerState } from '~~/lib/viewer/composables/setup'
import {
  useSelectionEvents,
  useViewerCameraControlEndTracker
} from '~~/lib/viewer/composables/viewer'
import { xor, TIME_MS } from '@speckle/shared'
import type { Nullable, Optional } from '@speckle/shared'
import { Vector3 } from 'three'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { broadcastViewerUserActivityMutation } from '~~/lib/viewer/graphql/mutations'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useIntervalFn, useWindowFocus } from '@vueuse/core'
import type { MaybeRef } from '@vueuse/core'
import type { CSSProperties, Ref } from 'vue'
import { useViewerAnchoredPoints } from '~~/lib/viewer/composables/anchorPoints'
import { useOnBeforeWindowUnload } from '~~/lib/common/composables/window'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { onViewerUserActivityBroadcastedSubscription } from '~~/lib/viewer/graphql/subscriptions'
import { useEmbed } from '~/lib/viewer/composables/setup/embed'

import {
  StateApplyMode,
  useApplySerializedState,
  useStateSerialization
} from '~~/lib/viewer/composables/serialization'
import type { Merge, OverrideProperties } from 'type-fest'
import { graphql } from '~/lib/common/generated/gql'
import {
  isSerializedViewerState,
  type SerializedViewerState
} from '@speckle/shared/viewer/state'
import { omit } from 'lodash-es'

/**
 * How often we send out an "activity" message even if user hasn't made any clicks (just to keep him active)
 */
const OWN_ACTIVITY_UPDATE_INTERVAL = 5 * TIME_MS.second
/**
 * How often we check for user staleness
 */
const USER_STALE_CHECK_INTERVAL = 2000
/**
 * How much time must pass after an update from user after which we consider them "stale" or "disconnected"
 */
const USER_STALE_AFTER_PERIOD = 20 * OWN_ACTIVITY_UPDATE_INTERVAL
/**
 * How much time must pass for a user to be completely removable if a new update hasn't been received from them
 */
const USER_REMOVABLE_AFTER_PERIOD = USER_STALE_AFTER_PERIOD * 2

type ViewerActivityMetadata = OverrideProperties<
  Required<Omit<ViewerUserActivityMessageInput, 'status'>>,
  { state: SerializedViewerState }
>

function useCollectMainMetadata() {
  const { sessionId } = useInjectedViewerState()
  const { activeUser } = useActiveUser()
  const { serialize } = useStateSerialization()
  return (): ViewerActivityMetadata => ({
    userId: activeUser.value?.id || null,
    userName: activeUser.value?.name || 'Anonymous Viewer',
    state: serialize(),
    sessionId: sessionId.value
  })
}

graphql(`
  fragment UseViewerUserActivityBroadcasting_Project on Project {
    id
    permissions {
      canBroadcastActivity {
        ...FullPermissionCheckResult
      }
    }
  }
`)

const useViewerRealtimeActivityState = () =>
  useState('viewer_realtime_activity_state', () => ({
    activity: undefined as Optional<ViewerActivityMetadata>,
    status: ViewerUserActivityStatus.Viewing as ViewerUserActivityStatus
  }))

export const useViewerRealtimeActivityTracker = () => {
  const state = useViewerRealtimeActivityState()
  const getMainMetadata = useCollectMainMetadata()

  const activity = computed({
    get: () => state.value.activity || getMainMetadata(),
    set: (value) => {
      state.value.activity = value
    }
  })

  const status = computed({
    get: () => state.value.status,
    set: (value) => {
      state.value.status = value
    }
  })

  const serializedState = computed(() => activity.value.state)

  // Ids for easy equality comparisons
  const serializedStateId = computed(() => JSON.stringify(serializedState.value))
  const activityId = computed(() => {
    const stateId = serializedStateId.value
    const otherActivity: Omit<ViewerActivityMetadata, 'state'> = omit(activity.value, [
      'state'
    ])
    const otherActivityId = JSON.stringify(otherActivity)
    return `${stateId}-${otherActivityId}-${status.value}`
  })

  const update = (params?: {
    newActivity?: ViewerActivityMetadata
    status?: ViewerUserActivityStatus
  }) => {
    activity.value = params?.newActivity || getMainMetadata()

    if (params?.status) {
      status.value = params.status
    }
  }

  return { activity, serializedState, status, update, serializedStateId, activityId }
}

export function useViewerUserActivityBroadcasting(
  options?: Partial<{
    state: InjectableViewerState
  }>
) {
  const {
    projectId,
    resources: {
      request: { resourceIdString },
      response: { project }
    }
  } = options?.state || useInjectedViewerState()
  const { update, activity, status, activityId } = useViewerRealtimeActivityTracker()
  const apollo = useApolloClient().client
  const { isEnabled: isEmbedEnabled } = useEmbed()

  const canBroadcast = computed(
    () => project.value?.permissions.canBroadcastActivity.authorized
  )

  const isSameActivity = (
    previousActivityId: Optional<string>,
    newActivityId: string
  ) => {
    if (xor(previousActivityId, newActivityId)) return false
    if (!previousActivityId && !newActivityId) return false
    return previousActivityId === newActivityId
  }

  const invokeMutation = async () => {
    const result = await apollo
      .mutate({
        mutation: broadcastViewerUserActivityMutation,
        variables: {
          resourceIdString: resourceIdString.value,
          message: {
            ...activity.value,
            status: status.value
          },
          projectId: projectId.value
        }
      })
      .catch(convertThrowIntoFetchResult)

    return result.data?.broadcastViewerUserActivity || false
  }

  let previousActivityId: Optional<string> = undefined
  const invokeObservabilityEvent = async () => {
    const dd = window.DD_RUM
    if (!dd || !('addAction' in dd)) return

    const message = {
      ...activity.value,
      status: status.value
    }

    if (isSameActivity(previousActivityId, activityId.value)) return

    previousActivityId = activityId.value
    dd.addAction('Viewer User Activity', { message })
  }

  const invoke = async () => {
    if (!canBroadcast.value || isEmbedEnabled.value) return false

    return await Promise.all([invokeMutation(), invokeObservabilityEvent()])
  }

  return {
    emitDisconnected: async () => {
      update({ status: ViewerUserActivityStatus.Disconnected })
      await invoke()
    },
    emitViewing: async () => {
      update({ status: ViewerUserActivityStatus.Viewing })
      await invoke()
    }
  }
}

export type UserActivityModel = Merge<
  OnViewerUserActivityBroadcastedSubscription['viewerUserActivityBroadcasted'],
  { state: SerializedViewerState }
> & {
  isStale: boolean
  isOccluded: boolean
  lastUpdate: Dayjs
  isClipped: boolean
  projectedPosition: [number, number]
  style: {
    target: Partial<CSSProperties>
  }
}

/**
 * Track other user activity and emit viewing/disconnected updates
 */
export function useViewerUserActivityTracking(params: {
  parentEl: Ref<Nullable<HTMLElement>>
}) {
  const { parentEl } = params

  const {
    projectId,
    sessionId,
    resources: {
      request: { resourceIdString, threadFilters }
    }
  } = useInjectedViewerState()
  const { isLoggedIn } = useActiveUser()
  const { triggerNotification } = useGlobalToast()
  const sendUpdate = useViewerUserActivityBroadcasting()
  const { isEnabled: isEmbedEnabled } = useEmbed()
  const { activeUser } = useActiveUser()

  // TODO: For some reason subscription is set up twice? Vue Apollo bug?
  const { onResult: onUserActivity } = useSubscription(
    onViewerUserActivityBroadcastedSubscription,
    () => ({
      target: {
        projectId: projectId.value,
        resourceIdString: resourceIdString.value,
        loadedVersionsOnly: threadFilters.value.loadedVersionsOnly
      },
      sessionId: sessionId.value
    }),
    () => ({
      enabled: isLoggedIn.value
    })
  )

  const users = ref({} as Record<string, UserActivityModel>)
  const { spotlightUserSessionId } = useInjectedViewerInterfaceState()
  const spotlightTracker = useViewerSpotlightTracking()

  onUserActivity((res) => {
    // TOTHINK/TODO: instead of fast OWN_ACTIVITY_UPDATE_INTERVAL, we could
    // send an event when we identify here that a new user joined the party

    if (!res.data?.viewerUserActivityBroadcasted) return
    const event = res.data.viewerUserActivityBroadcasted
    const status = event.status
    const incomingSessionId = event.sessionId
    const incomingUserId = event.userId

    // Prevent users from seeing their own activity notifications
    const currentUserId = activeUser.value?.id

    if (sessionId.value === incomingSessionId) return
    if (currentUserId && incomingUserId && currentUserId === incomingUserId) return

    if (!isEmbedEnabled.value && status === ViewerUserActivityStatus.Disconnected) {
      triggerNotification({
        title: `${users.value[incomingSessionId]?.userName || 'A user'} left.`,
        type: ToastNotificationType.Info
      })

      if (spotlightUserSessionId.value === incomingSessionId)
        spotlightUserSessionId.value = null // ensure we're not spotlighting disconnected users
      delete users.value[incomingSessionId]
      return
    }

    const state = isSerializedViewerState(event.state) ? event.state : null
    if (!state) return

    const userData: UserActivityModel = {
      ...(users.value[incomingSessionId]
        ? users.value[incomingSessionId]
        : {
            isClipped: false,
            projectedPosition: [0, 0],
            style: { target: {} },
            isOccluded: false
          }),
      ...event,
      state,
      isStale: false,
      lastUpdate: dayjs()
    }

    if (
      !isEmbedEnabled.value &&
      !Object.keys(users.value).includes(incomingSessionId)
    ) {
      triggerNotification({
        title: `${userData.userName} joined.`,
        type: ToastNotificationType.Info
      })
    }

    users.value[incomingSessionId] = userData

    if (spotlightUserSessionId.value === userData.sessionId) {
      spotlightTracker(userData)
    }
  })

  useViewerAnchoredPoints<UserActivityModel, Partial<{ smoothTranslation: boolean }>>({
    parentEl,
    points: computed(() => Object.values(users.value)),
    pointLocationGetter: (user) => {
      const selection = user.state.ui.selection
      const selectionVector = selection
        ? new Vector3(selection[0], selection[1], selection[2])
        : null

      function getPointInBetweenByPerc(
        pointA: Vector3,
        pointB: Vector3,
        percentage: number
      ) {
        let dir = pointB.clone().sub(pointA)
        const len = dir.length()
        dir = dir.normalize().multiplyScalar(len * percentage)
        return pointA.clone().add(dir)
      }

      // If there is no selection location, return to a blended location based on the camera's target and location.
      // This ensures that rotation and zoom will have an effect on the users' cursors and create a lively environment.
      if (!selectionVector) {
        const camPos = user.state.ui.camera.position
        const camPosVector = new Vector3(camPos[0], camPos[1], camPos[2])

        const camTarget = user.state.ui.camera.target
        const camTargetVector = new Vector3(camTarget[0], camTarget[1], camTarget[2])

        return getPointInBetweenByPerc(camTargetVector, camPosVector, 0.2)
      }

      return selectionVector.clone()
    },
    updatePositionCallback: (user, result, options) => {
      user.isOccluded = result.isOccluded
      user.style = {
        ...user.style,
        target: {
          ...user.style.target,
          ...result.style,
          transition: options?.smoothTranslation === false ? '' : 'all 0.1s ease'
          // opacity: user.isOccluded ? '0.5' : user.isStale ? '0.2' : '1.0' // note: handled in component via css
        }
      }
    }
  })

  const hideStaleUsers = () => {
    if (!Object.values(users.value).length) return

    // Mark stale users
    for (const [key, user] of Object.entries(users.value)) {
      user.isStale = user.lastUpdate.isBefore(
        dayjs().subtract(USER_STALE_AFTER_PERIOD, 'milliseconds')
      )

      // Remove altogether if stale for a while
      if (
        user.lastUpdate.isBefore(
          dayjs().subtract(USER_REMOVABLE_AFTER_PERIOD, 'millisecond')
        )
      ) {
        delete users.value[key]
      }
    }
  }

  const focused = useWindowFocus()

  // Disable disconnect-on-blur behaviour in development mode only
  // For testing multi-user interactions (like follow mode)
  watch(focused, async (newVal) => {
    if (import.meta.dev) return

    if (!newVal) {
      await sendUpdate.emitDisconnected()
    } else {
      await sendUpdate.emitViewing()
    }
  })
  const sendUpdateAndHideStaleUsers = () => {
    if (!focused.value) return
    hideStaleUsers()
    sendUpdate.emitViewing()
  }

  useIntervalFn(sendUpdateAndHideStaleUsers, OWN_ACTIVITY_UPDATE_INTERVAL)
  useIntervalFn(hideStaleUsers, USER_STALE_CHECK_INTERVAL)

  const selectionCallback = () => {
    // to ensure that useCollectSelection() works first
    nextTick(() => sendUpdateAndHideStaleUsers())
  }
  useSelectionEvents({
    singleClickCallback: selectionCallback,
    doubleClickCallback: selectionCallback
  })

  useViewerCameraControlEndTracker(() => sendUpdate.emitViewing())

  useOnBeforeWindowUnload(async () => await sendUpdate.emitDisconnected())

  onMounted(() => {
    sendUpdate.emitViewing()
  })

  onBeforeUnmount(() => {
    sendUpdate.emitDisconnected()
  })

  const state = useInjectedViewerState()

  // Removes object highlights from user selection on tracking stop;
  // Sets initial user state on tracking start
  watch(spotlightUserSessionId, (newVal) => {
    if (!newVal) {
      state.ui.highlightedObjectIds.value = []
      return
    }

    const user = Object.values(users.value).find((u) => u.sessionId === newVal)
    if (!user) return
    spotlightTracker(user)
  })

  watch(resourceIdString, (newVal, oldVal) => {
    if (newVal !== oldVal) {
      sendUpdate.emitViewing()
    }
  })

  return {
    users
  }
}

/**
 * TODO:
 * - Move user activity/thread stuff to setup so that it isn't strewn about
 */

function useViewerSpotlightTracking() {
  const applyState = useApplySerializedState()

  return async (user: UserActivityModel) => {
    await applyState(user.state, StateApplyMode.Spotlight)
  }
}

type UserTypingInfo = {
  userId: string
  userName: string
  thread: SerializedViewerState['ui']['threads']['openThread']
  lastSeen: Dayjs
}

export function useViewerThreadTypingTracking(threadId: MaybeRef<string>) {
  const usersTyping = ref([] as UserTypingInfo[])

  const {
    sessionId,
    projectId,
    resources: {
      request: { resourceIdString, threadFilters }
    }
  } = useInjectedViewerState()
  const { isLoggedIn } = useActiveUser()
  const { onResult: onUserActivity } = useSubscription(
    onViewerUserActivityBroadcastedSubscription,
    () => ({
      target: {
        projectId: projectId.value,
        resourceIdString: resourceIdString.value,
        loadedVersionsOnly: threadFilters.value.loadedVersionsOnly
      },
      sessionId: sessionId.value
    }),
    () => ({
      enabled: isLoggedIn.value
    })
  )

  onUserActivity((res) => {
    if (!res.data?.viewerUserActivityBroadcasted) return

    const event = res.data.viewerUserActivityBroadcasted
    const userId = event.userId || event.sessionId
    const existingItemIdx = usersTyping.value.findIndex((i) => i.userId === userId)

    // remove existing data before (potentially) adding new
    if (existingItemIdx !== -1) {
      usersTyping.value.splice(existingItemIdx, 1)
    }

    const state = isSerializedViewerState(event.state) ? event.state : null
    if (!state) return
    const typingPayload = state.ui.threads.openThread
    if (typingPayload.threadId !== unref(threadId)) {
      return
    }

    const typingInfo: UserTypingInfo = {
      userId,
      userName: event.userName,
      thread: typingPayload,
      lastSeen: dayjs()
    }

    if (typingInfo.thread.isTyping) usersTyping.value.push(typingInfo)
  })

  return {
    usersTyping: computed(() => usersTyping.value)
  }
}
