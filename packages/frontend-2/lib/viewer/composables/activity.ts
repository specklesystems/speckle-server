import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import { FilteringState, SelectionEvent } from '@speckle/viewer'
import {
  CommentDataInput,
  OnViewerUserActivityBroadcastedSubscription,
  ViewerUserActivityMessageInput,
  ViewerUserActivityStatus,
  ViewerUserOpenThreadMessage,
  ViewerUserSelectionInfoInput
} from '~~/lib/common/generated/gql/graphql'
import {
  InjectableViewerState,
  useInjectedViewerInterfaceState,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import {
  useSelectionEvents,
  useViewerCameraRestTracker
} from '~~/lib/viewer/composables/viewer'
import { Nullable, Optional } from '@speckle/shared'
import { Vector3 } from 'three'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { broadcastViewerUserActivityMutation } from '~~/lib/viewer/graphql/mutations'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import dayjs, { Dayjs } from 'dayjs'
import { get } from 'lodash-es'
import { MaybeRef, useIntervalFn } from '@vueuse/core'
import { CSSProperties, Ref } from 'vue'
import { SetFullyRequired } from '~~/lib/common/helpers/type'
import { useViewerAnchoredPoints } from '~~/lib/viewer/composables/anchorPoints'
import { useOnBeforeWindowUnload } from '~~/lib/common/composables/window'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { onViewerUserActivityBroadcastedSubscription } from '~~/lib/viewer/graphql/subscriptions'

/**
 * How often we send out an "activity" message even if user hasn't made any clicks (just to keep him active)
 */
const OWN_ACTIVITY_UPDATE_INTERVAL = 5 * 1000
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

function useCollectSelection() {
  const viewerState = useInjectedViewerState()
  const viewer = viewerState.viewer.instance

  const selectionLocation = ref(null as Nullable<Vector3>)

  const selectionCallback = (event: Nullable<SelectionEvent>) => {
    if (!event) return (selectionLocation.value = null) // reset selection location

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
      filteringState: {
        ...(viewerState.ui.filters.current.value || {}),
        selectedObjects: viewerState.ui.selection.objects.value.map(
          (o) => o.id as string
        )
      },
      selectionLocation: selectionLocation.value,
      sectionBox: viewer.getCurrentSectionBox(),
      camera
    }
  }
}

export function useCollectCommentData() {
  const collectSelection = useCollectSelection()
  return (): CommentDataInput => {
    const { selectionLocation, camera, sectionBox, filteringState } = collectSelection()
    const filters = filteringState as Nullable<FilteringState>

    return {
      location: selectionLocation || new Vector3(camera[3], camera[4], camera[5]),
      camPos: camera,
      sectionBox,
      // In the future comments might keep track of selected objects
      selection: null,
      filters: {
        hiddenIds: filters?.hiddenObjects || null,
        isolatedIds: filters?.isolatedObjects || null,
        propertyInfoKey: filters?.activePropFilterKey || null,
        passMax: filters?.passMax || null,
        passMin: filters?.passMin || null,
        sectionBox // possible duplicate, see above
      }
    }
  }
}

function useCollectMainMetadata() {
  const {
    sessionId,
    resources: {
      request: { resourceIdString }
    },
    ui: {
      threads: { openThread }
    }
  } = useInjectedViewerState()
  const { activeUser } = useActiveUser()

  return (): Omit<ViewerUserActivityMessageInput, 'status' | 'selection'> => ({
    userId: activeUser.value?.id || null,
    userName: activeUser.value?.name || 'Anonymous Viewer',
    viewerSessionId: sessionId.value,
    resourceIdString: resourceIdString.value,
    thread:
      openThread.thread.value || openThread.newThreadEditor
        ? {
            threadId: openThread.thread.value?.id || null,
            isTyping: openThread.isTyping.value
          }
        : null
  })
}

export function useViewerUserActivityBroadcasting(
  options?: Partial<{
    state: InjectableViewerState
  }>
) {
  const {
    projectId,
    resources: {
      request: { resourceIdString }
    }
  } = options?.state || useInjectedViewerState()
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
        selection: null
      }),
    emitViewing: async () => {
      await invokeMutation({
        ...getMainMetadata(),
        status: ViewerUserActivityStatus.Viewing,
        selection: getSelection()
      })
    }
  }
}

export type UserActivityModel = SetFullyRequired<
  OnViewerUserActivityBroadcastedSubscription['viewerUserActivityBroadcasted'],
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
      request: { resourceIdString, threadFilters }
    }
  } = useInjectedViewerState()
  const { isLoggedIn } = useActiveUser()
  const { triggerNotification } = useGlobalToast()
  const sendUpdate = useViewerUserActivityBroadcasting()

  // TODO: For some reason subscription is set up twice? Vue Apollo bug?
  const { onResult: onUserActivity } = useSubscription(
    onViewerUserActivityBroadcastedSubscription,
    () => ({
      target: {
        projectId: projectId.value,
        resourceIdString: resourceIdString.value,
        loadedVersionsOnly: threadFilters.value.loadedVersionsOnly
      }
    }),
    () => ({
      enabled: isLoggedIn.value
    })
  )

  const users = ref({} as Record<string, UserActivityModel>)
  const { spotlightUserId } = useInjectedViewerInterfaceState()
  const spotlightTracker = useViewerSpotlightTracking()

  onUserActivity((res) => {
    // TOTHINK/TODO: instead of fast OWN_ACTIVITY_UPDATE_INTERVAL, we could
    // send an event when we identify here that a new user joined the party

    if (!res.data?.viewerUserActivityBroadcasted) return
    const event = res.data.viewerUserActivityBroadcasted
    const status = event.status
    const incomingSessionId = event.viewerSessionId

    if (sessionId.value === incomingSessionId) return
    if (status === ViewerUserActivityStatus.Disconnected || !event.selection) {
      triggerNotification({
        description: `${users.value[incomingSessionId].userName} left.`,
        type: ToastNotificationType.Info
      })
      if (spotlightUserId.value === incomingSessionId) spotlightUserId.value = null // ensure we're not spotlighting disconnected users
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

    if (!Object.keys(users.value).includes(incomingSessionId)) {
      triggerNotification({
        description: `${userData.userName} joined.`,
        type: ToastNotificationType.Info
      })
    }

    users.value[incomingSessionId] = userData

    if (spotlightUserId.value === userData.userId) {
      spotlightTracker(userData)
    }
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
      if (!selectionLocation) {
        const loc = new Vector3(
          selection.camera[0],
          selection.camera[1],
          selection.camera[2]
        )
        const camTarget = new Vector3(
          selection.camera[3],
          selection.camera[4],
          selection.camera[5]
        )
        return getPointInBetweenByPerc(camTarget, loc, 0.2)
      }

      return new Vector3(selectionLocation.x, selectionLocation.y, selectionLocation.z)
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

  useViewerCameraRestTracker(() => sendUpdate.emitViewing())

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
  watch(spotlightUserId, (newVal) => {
    if (!newVal) return state.viewer.instance.highlightObjects([])
    const user = Object.values(users.value).find((u) => u.userId === newVal)
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

function useViewerSpotlightTracking() {
  const state = useInjectedViewerState()
  return async (user: UserActivityModel) => {
    state.viewer.instance.setView({
      position: new Vector3(
        user.selection.camera[0],
        user.selection.camera[1],
        user.selection.camera[2]
      ),
      target: new Vector3(
        user.selection.camera[3],
        user.selection.camera[4],
        user.selection.camera[5]
      )
    })

    if (user.selection.sectionBox) {
      state.ui.sectionBox.setSectionBox(
        user.selection.sectionBox as {
          min: { x: number; y: number; z: number }
          max: { x: number; y: number; z: number }
        },
        0
      )
      if (!state.ui.sectionBox.isSectionBoxEnabled.value)
        state.ui.sectionBox.sectionBoxOn()
    } else {
      state.ui.sectionBox.sectionBoxOff()
    }

    if (user.selection.filteringState) {
      const fs = user.selection.filteringState as FilteringState
      await state.ui.filters.resetFilters()

      if (fs.hiddenObjects)
        await state.ui.filters.hideObjects(fs.hiddenObjects, 'tracking')

      if (fs.isolatedObjects)
        await state.ui.filters.isolateObjects(fs.isolatedObjects, 'tracking')

      if (fs.selectedObjects) {
        state.viewer.instance.highlightObjects(fs.selectedObjects)
      } else {
        state.viewer.instance.highlightObjects([])
      }

      // Note: commented out as it's a bit "intrusive" behaviour, opted for the
      // highlight version above.
      // state.ui.selection.setSelectionFromObjectIds(fs.selectedObjects)

      // TODOs: filters implementation, once they are implemented in the FE
    }

    // sync resourceIdString to ensure we have the same exact resources loaded
    if (state.resources.request.resourceIdString.value !== user.resourceIdString) {
      state.resources.request.resourceIdString.value = user.resourceIdString
    }

    // sync opened thread
    if (state.urlHashState.focusedThreadId.value !== user.thread?.threadId) {
      state.urlHashState.focusedThreadId.value = user.thread?.threadId || null
    }
  }
}

type UserTypingInfo = {
  userId: string
  userName: string
  thread: ViewerUserOpenThreadMessage
  lastSeen: Dayjs
}

export function useViewerThreadTypingTracking(threadId: MaybeRef<string>) {
  const usersTyping = ref([] as UserTypingInfo[])

  const {
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
      }
    }),
    () => ({
      enabled: isLoggedIn.value
    })
  )

  onUserActivity((res) => {
    if (!res.data?.viewerUserActivityBroadcasted) return

    const event = res.data.viewerUserActivityBroadcasted
    const typingPayload = event.thread
    const userId = event.userId || event.viewerSessionId

    const existingItemIdx = usersTyping.value.findIndex((i) => i.userId === userId)

    // remove existing data before (potentially) adding new
    if (existingItemIdx !== -1) {
      usersTyping.value.splice(existingItemIdx, 1)
    }

    if (typingPayload?.threadId !== unref(threadId)) {
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
