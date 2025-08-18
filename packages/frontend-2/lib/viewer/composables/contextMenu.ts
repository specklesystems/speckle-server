import type { CSSProperties } from 'vue'
import type { Nullable } from '@speckle/shared'
import { useInjectedViewerInterfaceState } from '~~/lib/viewer/composables/setup'
import type { Vector3 } from 'three'
import { useViewerAnchoredPoints } from '~~/lib/viewer/composables/anchorPoints'
import { useSelectionEvents } from '~~/lib/viewer/composables/viewer'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import {
  useSelectionUtilities,
  useFilterUtilities,
  useCameraUtilities
} from '~~/lib/viewer/composables/ui'

export type ViewerContextMenuModel = {
  isVisible: boolean
  clickLocation: Nullable<Vector3>
  selectedObjectId: Nullable<string>
  style: Partial<CSSProperties>
}

export function useViewerContextMenu(params: {
  parentEl: Ref<Nullable<HTMLElement>>
  emit: (event: 'menu-opened') => void
}) {
  const { parentEl, emit } = params
  const { filters } = useInjectedViewerInterfaceState()
  const { setSelectionFromObjectIds, clearSelection } = useSelectionUtilities()
  const { isolateObjects, hideObjects, unIsolateObjects } = useFilterUtilities()
  const { copy } = useClipboard()
  const { zoomExtentsOrSelection } = useCameraUtilities()

  const contextMenuState = ref<ViewerContextMenuModel>({
    isVisible: false,
    clickLocation: null,
    selectedObjectId: null,
    style: {}
  })

  // Generate context menu items based on selected objects
  const contextMenuItems = computed<LayoutMenuItem[][]>(() => {
    const selectedObject = filters.selectedObjects.value[0]
    if (!selectedObject) return []

    const isIsolated = filters.isolatedObjectIds.value.includes(selectedObject.id)

    return [
      [
        {
          id: 'hide',
          title: 'Hide selection',
          icon: undefined
        },
        {
          id: isIsolated ? 'unisolate' : 'isolate',
          title: isIsolated ? 'Un-isolate selection' : 'Isolate selection',
          icon: undefined
        },
        {
          id: 'fit-to-view',
          title: 'Fit to view',
          icon: undefined
        },
        {
          id: 'copy-id',
          title: 'Copy Object ID',
          icon: undefined
        }
      ],
      [
        {
          id: 'clear-selection',
          title: 'Clear selection',
          icon: undefined
        }
      ]
    ]
  })

  const shouldShowContextMenu = computed(() => {
    return contextMenuState.value.isVisible && filters.selectedObjects.value.length > 0
  })

  // Use anchored points for positioning
  const { updatePositions } = useViewerAnchoredPoints({
    parentEl,
    points: computed(() => contextMenuState.value),
    pointLocationGetter: (b) => b.clickLocation,
    updatePositionCallback: (state, result) => {
      state.style = {
        ...state.style,
        ...result.style,
        opacity: result.isOccluded ? '0.8' : '1.0'
      }
    }
  })

  const closeContextMenu = () => {
    contextMenuState.value.isVisible = false
    contextMenuState.value.clickLocation = null
    contextMenuState.value.selectedObjectId = null
  }

  const onItemChosen = ({ item }: { item: LayoutMenuItem }) => {
    closeContextMenu()

    const selectedObject = filters.selectedObjects.value[0]
    if (!selectedObject) return

    switch (item.id) {
      case 'hide': {
        hideObjects([selectedObject.id])
        break
      }

      case 'isolate': {
        isolateObjects([selectedObject.id])
        break
      }

      case 'unisolate': {
        unIsolateObjects([selectedObject.id])
        break
      }

      case 'copy-id': {
        copy(selectedObject.id)
        break
      }

      case 'fit-to-view': {
        zoomExtentsOrSelection()
        break
      }

      case 'clear-selection': {
        clearSelection()
        break
      }
    }
  }

  // Handle right-clicks for context menu
  useSelectionEvents({
    singleClickCallback: (event, { firstVisibleSelectionHit }) => {
      if (!event?.event || event.event.button !== 2) return

      event.event.preventDefault()

      if (firstVisibleSelectionHit) {
        const clickLocation = firstVisibleSelectionHit.point.clone()
        const selectedObjectId = firstVisibleSelectionHit.node.model.id

        setSelectionFromObjectIds([selectedObjectId])

        contextMenuState.value.clickLocation = clickLocation
        contextMenuState.value.selectedObjectId = selectedObjectId
        contextMenuState.value.isVisible = true

        emit('menu-opened')

        nextTick(() => {
          updatePositions()
        })
      } else {
        closeContextMenu()
      }
    }
  })

  return {
    contextMenuState,
    contextMenuItems,
    shouldShowContextMenu,
    onItemChosen,
    closeContextMenu
  }
}
