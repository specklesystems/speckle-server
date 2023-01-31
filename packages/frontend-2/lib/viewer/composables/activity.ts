import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import { SelectionEvent } from '@speckle/viewer'
import {
  ViewerUserActivityMessage,
  ViewerUserActivityMessageInput,
  ViewerUserActivityStatus,
  ViewerUserSelectionInfoInput,
  ViewerUserTypingMessage,
  ViewerUserTypingMessageInput
} from '~~/lib/common/generated/gql/graphql'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useSelectionEvents } from '~~/lib/viewer/composables/viewer'
import { Nullable, Optional } from '@speckle/shared'
import { Vector3 } from 'three'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { broadcastViewerUserActivityMutation } from '~~/lib/viewer/graphql/mutations'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { onViewerUserActivityBroadcastedSubscription } from '../graphql/subscriptions'
import dayjs, { Dayjs } from 'dayjs'
import { get } from 'lodash-es'
import { MaybeRef, useIntervalFn } from '@vueuse/core'
import { CSSProperties, Ref } from 'vue'
import { SetFullyRequired } from '~~/lib/common/helpers/type'
import { useViewerAnchoredPoints } from '~~/lib/viewer/composables/anchorPoints'

/**
 * How often we send out an "activity" message even if user hasn't made any clicks (just to keep him active)
 */
const OWN_ACTIVITY_UPDATE_INTERVAL = 60 * 1000
/**
 * How often we check for user staleness
 */
const USER_STALE_CHECK_INTERVAL = 2000
/**
 * How much time must pass after an update from user after which we consider them "stale" or "disconnected"
 */
const USER_STALE_AFTER_PERIOD = 2 * OWN_ACTIVITY_UPDATE_INTERVAL
/**
 * How much time must pass for a user to be completely removable if a new update hasn't been received from them
 */
const USER_REMOVABLE_AFTER_PERIOD = USER_STALE_AFTER_PERIOD * 2

function useCollectSelection() {
  const viewerState = useInjectedViewerState()
  const viewer = viewerState.viewer.instance

  const selectionLocation = ref(null as Nullable<Vector3>)

  const selectionCallback = (event: Nullable<SelectionEvent>) => {
    if (!event) return

    console.log(event)
    const firstHit = event.hits[0]
    selectionLocation.value = firstHit.point
  }
  useSelectionEvents({
    singleClickCallback: selectionCallback,
    doubleClickCallback: selectionCallback
  })

  return (): ViewerUserSelectionInfoInput => {
    const controls = viewer.cameraHandler.activeCam.controls
    const pos = controls.getPosition(new Vector3())
    const target = controls.getTarget(new Vector3())
    const camera = [
      parseFloat(pos.x.toFixed(5)),
      parseFloat(pos.y.toFixed(5)),
      parseFloat(pos.z.toFixed(5)),
      parseFloat(target.x.toFixed(5)),
      parseFloat(target.y.toFixed(5)),
      parseFloat(target.z.toFixed(5)),
      viewer.cameraHandler.activeCam.name === 'ortho' ? 1 : 0,
      get(controls, '_zoom') // kinda hacky, _zoom is a protected prop
    ]

    return {
      filteringState: { ...viewerState.ui.filters.current.value },
      selectionLocation: selectionLocation.value,
      sectionBox: viewer.getCurrentSectionBox(),
      camera
    }
  }
}

function useCollectMainMetadata() {
  const { sessionId } = useInjectedViewerState()
  const { activeUser } = useActiveUser()

  return (): Omit<
    ViewerUserActivityMessageInput,
    'status' | 'selection' | 'typing'
  > => ({
    userId: activeUser.value?.id || null,
    userName: activeUser.value?.name || 'Anonymous Viewer',
    viewerSessionId: sessionId.value
  })
}

export function useViewerUserActivityBroadcasting() {
  const {
    projectId,
    resources: {
      request: { resourceIdString }
    }
  } = useInjectedViewerState()
  const { isLoggedIn } = useActiveUser()
  const getSelection = useCollectSelection()
  const getMainMetadata = useCollectMainMetadata()
  const apollo = useApolloClient().client

  const invokeMutation = async (message: ViewerUserActivityMessageInput) => {
    if (!isLoggedIn.value) return false
    const result = await apollo
      .mutate({
        mutation: broadcastViewerUserActivityMutation,
        variables: {
          resourceIdString: resourceIdString.value,
          message,
          projectId: projectId.value
        }
      })
      .catch(convertThrowIntoFetchResult)

    return result.data?.broadcastViewerUserActivity || false
  }

  return {
    emitDisconnected: async () =>
      invokeMutation({
        ...getMainMetadata(),
        status: ViewerUserActivityStatus.Disconnected,
        selection: null,
        typing: null
      }),
    emitViewing: async () =>
      invokeMutation({
        ...getMainMetadata(),
        status: ViewerUserActivityStatus.Viewing,
        selection: getSelection(),
        typing: null
      }),
    emitTyping: async (typing: ViewerUserTypingMessageInput) =>
      invokeMutation({
        ...getMainMetadata(),
        status: ViewerUserActivityStatus.Typing,
        selection: getSelection(),
        typing
      })
  }
}

export type UserActivityModel = SetFullyRequired<
  ViewerUserActivityMessage,
  'selection'
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
      request: { resourceIdString }
    }
  } = useInjectedViewerState()
  const { isLoggedIn } = useActiveUser()
  const sendUpdate = useViewerUserActivityBroadcasting()

  // TODO: For some reason subscription is set up twice? Vue Apollo bug?
  const { onResult: onUserActivity } = useSubscription(
    onViewerUserActivityBroadcastedSubscription,
    () => ({
      projectId: projectId.value,
      resourceIdString: resourceIdString.value
    }),
    () => ({
      enabled: isLoggedIn.value
    })
  )

  const users = ref({} as Record<string, UserActivityModel>)

  onUserActivity((res) => {
    if (!res.data?.viewerUserActivityBroadcasted) return
    const event = res.data.viewerUserActivityBroadcasted
    const status = event.status
    const incomingSessionId = event.viewerSessionId

    if (sessionId.value === incomingSessionId) return
    if (status === ViewerUserActivityStatus.Disconnected || !event.selection) {
      delete users.value[incomingSessionId]
      return
    }

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
      selection: event.selection,
      isStale: false,
      lastUpdate: dayjs()
    }
    users.value[incomingSessionId] = userData
  })

  useViewerAnchoredPoints<UserActivityModel, Partial<{ smoothTranslation: boolean }>>({
    parentEl,
    points: computed(() => Object.values(users.value)),
    pointLocationGetter: (user) => {
      const selection = user.selection
      const selectionLocation = selection.selectionLocation as Optional<{
        x: number
        y: number
        z: number
      }>

      const target = selectionLocation
        ? new Vector3(selectionLocation.x, selectionLocation.y, selectionLocation.z)
        : new Vector3(selection.camera[3], selection.camera[4], selection.camera[5])

      return target
    },
    updatePositionCallback: (user, result, options) => {
      user.isOccluded = result.isOccluded
      user.style = {
        ...user.style,
        target: {
          ...user.style.target,
          ...result.style,
          transition: options?.smoothTranslation === false ? '' : 'all 0.1s ease',
          opacity: user.isOccluded ? '0.5' : user.isStale ? '0.2' : '1.0'
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

  const sendUpdateAndHideStaleUsers = () => {
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

  onBeforeUnmount(() => {
    sendUpdate.emitDisconnected()
  })

  return {
    users
  }
}

type UserTypingInfo = {
  userId: string
  userName: string
  typing: ViewerUserTypingMessage
  lastSeen: Dayjs
}

export function useViewerThreadTypingTracking(threadId: MaybeRef<string>) {
  const usersTyping = ref([] as UserTypingInfo[])

  const {
    projectId,
    resources: {
      request: { resourceIdString }
    }
  } = useInjectedViewerState()
  const { isLoggedIn } = useActiveUser()
  const { onResult: onUserActivity } = useSubscription(
    onViewerUserActivityBroadcastedSubscription,
    () => ({
      projectId: projectId.value,
      resourceIdString: resourceIdString.value
    }),
    () => ({
      enabled: isLoggedIn.value
    })
  )

  onUserActivity((res) => {
    if (!res.data?.viewerUserActivityBroadcasted) return

    const event = res.data.viewerUserActivityBroadcasted
    if (event.status !== ViewerUserActivityStatus.Typing || !event.typing) return

    const typingPayload = event.typing
    if (typingPayload.threadId !== unref(threadId)) return

    const typingInfo: UserTypingInfo = {
      userId: event.userId || event.viewerSessionId,
      userName: event.userName,
      typing: typingPayload,
      lastSeen: dayjs()
    }

    const existingItemIdx = usersTyping.value.findIndex(
      (i) => i.userId === typingInfo.userId
    )

    if (existingItemIdx !== -1) {
      usersTyping.value.splice(existingItemIdx, 1)
    }

    if (typingInfo.typing.isTyping) usersTyping.value.push(typingInfo)
  })

  return {
    usersTyping: computed(() => usersTyping.value)
  }
}
