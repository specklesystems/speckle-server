import { MathUtils } from 'three'
import { isEqual } from 'lodash-es'
import {
  type CameraController,
  SelectionExtension,
  type SelectionExtensionOptions,
  type IViewer,
  StencilOutlineType
} from '@speckle/viewer'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import { useOnViewerLoadComplete } from '~/lib/viewer/composables/viewer'

/**
 * Highlighting extension that replicates LegacyViewer's HighlightExtension
 * Uses SelectionExtension but disables default events for UI-only highlighting
 */
class HighlightExtension extends SelectionExtension {
  public constructor(viewer: IViewer, cameraProvider: CameraController) {
    super(viewer, cameraProvider)

    // Configure highlighting material to match LegacyViewer's HighlightExtension
    const highlightMaterialData: SelectionExtensionOptions = {
      selectionMaterialData: {
        id: MathUtils.generateUUID(),
        color: 0x04cbfb,
        emissive: 0x0,
        opacity: 1,
        roughness: 1,
        metalness: 0,
        vertexColors: false,
        lineWeight: 1,
        stencilOutlines: StencilOutlineType.OVERLAY,
        pointSize: 4
      }
    }
    this.options = highlightMaterialData
  }
}

/**
 * Post-setup integration that sets up highlighting extension and watches state
 * This should only be called once during post-setup after the viewer is initialized.
 */
export const useHighlightingPostSetup = () => {
  const {
    ui: { highlightedObjectIds },
    viewer: { instance }
  } = useInjectedViewerState()

  const highlightExtension = ref<HighlightExtension | null>(null)

  // Get the highlighting extension instance
  const getHighlightExtension = () => {
    if (!highlightExtension.value) {
      highlightExtension.value = instance.createExtension(HighlightExtension)
    }
    return highlightExtension.value
  }

  // Initialize extension on viewer load
  useOnViewerLoadComplete(
    ({ isInitial }) => {
      if (!isInitial) return
      getHighlightExtension()
    },
    { initialOnly: true }
  )

  // state -> viewer: Update highlighted objects when state changes
  watch(
    highlightedObjectIds,
    (newIds, oldIds) => {
      const extension = getHighlightExtension()
      if (!extension) return

      // Clear all current highlights if new list is empty
      if (!newIds.length) {
        extension.clearSelection()
        return
      }

      if (oldIds && isEqual(newIds, oldIds)) return

      if (newIds.length > 0) {
        extension.selectObjects(newIds)
      }
    },
    { immediate: true, flush: 'sync' }
  )
}
