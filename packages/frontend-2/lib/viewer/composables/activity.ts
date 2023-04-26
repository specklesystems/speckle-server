import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import {
  OnViewerUserActivityBroadcastedSubscription,
  ViewerUserActivityMessageInput,
  ViewerUserActivityStatus
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
import { Nullable, SpeckleViewer } from '@speckle/shared'
import { Box3, Vector3 } from 'three'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { broadcastViewerUserActivityMutation } from '~~/lib/viewer/graphql/mutations'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import dayjs, { Dayjs } from 'dayjs'
import { MaybeRef, useIntervalFn } from '@vueuse/core'
import { CSSProperties, Ref } from 'vue'
import { useViewerAnchoredPoints } from '~~/lib/viewer/composables/anchorPoints'
import { useOnBeforeWindowUnload } from '~~/lib/common/composables/window'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { onViewerUserActivityBroadcastedSubscription } from '~~/lib/viewer/graphql/subscriptions'
import {
  useCameraUtilities,
  useFilterUtilities,
  useSectionBoxUtilities
} from '~~/lib/viewer/composables/ui'
import { useStateSerialization } from '~~/lib/viewer/composables/serialization'
import { Merge } from 'type-fest'

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

// function useCollectSelection() {
//   const viewerState = useInjectedViewerState()

//   const selectionLocation = ref(null as Nullable<Vector3>)

//   const selectionCallback = (event: Nullable<SelectionEvent>) => {
//     if (!event) return (selectionLocation.value = null) // reset selection location

//     const firstHit = event.hits[0]
//     selectionLocation.value = firstHit.point
//   }
//   useSelectionEvents({
//     singleClickCallback: selectionCallback,
//     doubleClickCallback: selectionCallback
//   })

//   return (): ViewerUserSelectionInfoInput => {
//     const controls = viewerState.viewer.instance.cameraHandler.activeCam.controls
//     const pos = viewerState.ui.camera.position.value
//     const target = viewerState.ui.camera.target.value
//     const camera = [
//       parseFloat(pos.x.toFixed(5)),
//       parseFloat(pos.y.toFixed(5)),
//       parseFloat(pos.z.toFixed(5)),
//       parseFloat(target.x.toFixed(5)),
//       parseFloat(target.y.toFixed(5)),
//       parseFloat(target.z.toFixed(5)),
//       viewerState.ui.camera.isOrthoProjection.value ? 1 : 0,
//       get(controls, '_zoom') // kinda hacky, _zoom is a protected prop
//     ]

//     return {
//       filteringState: {
//         ...(viewerState.viewer.metadata.filteringState || {}),
//         selectedObjects: viewerState.ui.filters.selectedObjects.value
//           .map((o) => o.id)
//           .filter((i): i is NonNullable<typeof i> => !!i)
//       },
//       selectionLocation: selectionLocation.value,
//       sectionBox: viewerState.ui.sectionBox.value,
//       camera
//     }
//   }
// }

// export function useCollectCommentData() {
//   const collectSelection = useCollectSelection()
//   return (): CommentDataInput => {
//     const { selectionLocation, camera, sectionBox, filteringState } = collectSelection()
//     const filters = filteringState as Nullable<FilteringState>

//     return {
//       location: selectionLocation || new Vector3(camera[3], camera[4], camera[5]),
//       camPos: camera,
//       sectionBox,
//       // In the future comments might keep track of selected objects
//       selection: null,
//       filters: {
//         hiddenIds: filters?.hiddenObjects || null,
//         isolatedIds: filters?.isolatedObjects || null,
//         propertyInfoKey: filters?.activePropFilterKey || null,
//         passMax: filters?.passMax || null,
//         passMin: filters?.passMin || null,
//         sectionBox // possible duplicate, see above
//       }
//     }
//   }
// }

function useCollectMainMetadata() {
  const { sessionId } = useInjectedViewerState()
  const { activeUser } = useActiveUser()
  const { serialize } = useStateSerialization()

  return (): Omit<ViewerUserActivityMessageInput, 'status' | 'selection'> => ({
    userId: activeUser.value?.id || null,
    userName: activeUser.value?.name || 'Anonymous Viewer',
    state: serialize(),
    sessionId: sessionId.value
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
        status: ViewerUserActivityStatus.Disconnected
      }),
    emitViewing: async () => {
      await invokeMutation({
        ...getMainMetadata(),
        status: ViewerUserActivityStatus.Viewing
      })
    }
  }
}

export type UserActivityModel = Merge<
  OnViewerUserActivityBroadcastedSubscription['viewerUserActivityBroadcasted'],
  { state: SpeckleViewer.ViewerState.SerializedViewerState }
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
    const incomingSessionId = event.sessionId

    if (sessionId.value === incomingSessionId) return
    if (status === ViewerUserActivityStatus.Disconnected) {
      triggerNotification({
        description: `${users.value[incomingSessionId].userName} left.`,
        type: ToastNotificationType.Info
      })
      if (spotlightUserId.value === incomingSessionId) spotlightUserId.value = null // ensure we're not spotlighting disconnected users
      delete users.value[incomingSessionId]
      return
    }

    const state = SpeckleViewer.ViewerState.isSerializedViewerState(event.state)
      ? event.state
      : null
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
    if (!newVal) {
      state.ui.highlightedObjectIds.value = []
      return
    }

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
  const { sectionBox } = useSectionBoxUtilities()
  const { camera } = useCameraUtilities()
  const { resetFilters, hideObjects, isolateObjects } = useFilterUtilities()

  return (user: UserActivityModel) => {
    camera.position.value = new Vector3(
      user.state.ui.camera.position[0],
      user.state.ui.camera.position[1],
      user.state.ui.camera.position[2]
    )
    camera.target.value = new Vector3(
      user.state.ui.camera.target[0],
      user.state.ui.camera.target[1],
      user.state.ui.camera.target[2]
    )

    if (user.state.ui.sectionBox) {
      sectionBox.value = new Box3(
        new Vector3(
          user.state.ui.sectionBox.min[0],
          user.state.ui.sectionBox.min[1],
          user.state.ui.sectionBox.min[2]
        ),
        new Vector3(
          user.state.ui.sectionBox.max[0],
          user.state.ui.sectionBox.max[1],
          user.state.ui.sectionBox.max[2]
        )
      )
    } else {
      sectionBox.value = null
    }

    const filters = user.state.ui.filters
    if (filters.hiddenObjectIds.length) {
      resetFilters()
      hideObjects(filters.hiddenObjectIds, { replace: true })
    } else if (filters.isolatedObjectIds.length) {
      resetFilters()
      isolateObjects(filters.isolatedObjectIds, { replace: true })
    }

    if (filters.selectedObjectIds.length) {
      // Note: commented out as it's a bit "intrusive" behaviour, opted for the
      // highlight version above.
      // state.ui.selection.setSelectionFromObjectIds(fs.selectedObjects)

      // TODOs: filters implementation, once they are implemented in the FE
      state.ui.highlightedObjectIds.value = filters.selectedObjectIds.slice()
    }

    // sync resourceIdString to ensure we have the same exact resources loaded
    const resourceIdString = user.state.resources.request.resourceIdString
    if (state.resources.request.resourceIdString.value !== resourceIdString) {
      state.resources.request.resourceIdString.value = resourceIdString
    }

    // sync opened thread
    const openThreadId = user.state.ui.threads.openThread.threadId
    if (state.urlHashState.focusedThreadId.value !== openThreadId) {
      state.urlHashState.focusedThreadId.value = openThreadId || null
    }
  }
}

type UserTypingInfo = {
  userId: string
  userName: string
  thread: SpeckleViewer.ViewerState.SerializedViewerState['ui']['threads']['openThread']
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
    const userId = event.userId || event.sessionId
    const existingItemIdx = usersTyping.value.findIndex((i) => i.userId === userId)

    // remove existing data before (potentially) adding new
    if (existingItemIdx !== -1) {
      usersTyping.value.splice(existingItemIdx, 1)
    }

    const state = SpeckleViewer.ViewerState.isSerializedViewerState(event.state)
      ? event.state
      : null
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
