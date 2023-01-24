import { useApolloClient } from '@vue/apollo-composable'
import { SelectionEvent } from '@speckle/viewer'
import {
  ViewerUserActivityMessageInput,
  ViewerUserActivityStatus,
  ViewerUserSelectionInfoInput,
  ViewerUserTypingMessageInput
} from '~~/lib/common/generated/gql/graphql'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useSelectionEvents } from '~~/lib/viewer/composables/viewer'
import { Nullable, SpeckleViewer } from '@speckle/shared'
import { Vector3 } from 'three'
import type CameraControls from 'camera-controls'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { nanoid } from 'nanoid'
import { broadcastViewerUserActivityMutation } from '~~/lib/viewer/graphql/mutations'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'

type RealCameraControls = CameraControls & { _zoom: number }

function useCollectSelection() {
  const viewerState = useInjectedViewerState()
  const viewer = viewerState.viewer.instance

  const selectionLocation = ref(null as Nullable<Vector3>)

  const selectionCallback = (event: SelectionEvent) => {
    if (!event) return

    const firstHit = event.hits[0]
    selectionLocation.value = firstHit.point
  }
  useSelectionEvents({
    singleClickCallback: selectionCallback,
    doubleClickCallback: selectionCallback
  })

  return (): ViewerUserSelectionInfoInput => {
    // TODO: Get _zoom a proper way, @dim/@alex do u know how?
    const controls = viewer.cameraHandler.activeCam
      .controls as unknown as RealCameraControls
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
      controls._zoom
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
  const { activeUser } = useActiveUser()
  const sessionId = ref(nanoid())

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
      request: { items }
    }
  } = useInjectedViewerState()
  const getSelection = useCollectSelection()
  const getMainMetadata = useCollectMainMetadata()
  const apollo = useApolloClient().client

  const resourceIdString = computed(() =>
    SpeckleViewer.ViewerRoute.createGetParamFromResources(items.value)
  )

  const invokeMutation = async (message: ViewerUserActivityMessageInput) => {
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
