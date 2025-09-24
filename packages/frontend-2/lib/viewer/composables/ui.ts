import { SpeckleViewer } from '@speckle/shared'
import {
  CameraController,
  type TreeNode,
  type ViewMode,
  type CanonicalView,
  type InlineView,
  type SpeckleView,
  MeasurementsExtension
} from '@speckle/viewer'
import { Box3, Vector3, Matrix3 } from 'three'
import { OBB } from 'three/examples/jsm/math/OBB'
import { until } from '@vueuse/shared'
import { useActiveElement } from '@vueuse/core'
import { isString, isEqualWith } from 'lodash-es'
import { useEmbedState, useEmbed } from '~/lib/viewer/composables/setup/embed'
import type { SpeckleObject } from '~/lib/viewer/helpers/sceneExplorer'
import { isNonNullable } from '~~/lib/common/helpers/utils'
import {
  useInjectedViewer,
  useInjectedViewerInterfaceState,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { ViewerRenderPageType } from '~/lib/viewer/helpers/state'
import { useDiffBuilderUtilities } from '~~/lib/viewer/composables/setup/diff'
import { getKeyboardShortcutTitle, onKeyboardShortcut } from '@speckle/ui-components'
import { ViewerShortcuts } from '~/lib/viewer/helpers/shortcuts/shortcuts'
import type {
  ViewerShortcut,
  ViewerShortcutAction
} from '~/lib/viewer/helpers/shortcuts/types'
import { useMixpanel } from '~/lib/core/composables/mp'
import type { defaultEdgeColorValue } from '~/lib/viewer/composables/setup/viewMode'
import {
  defaultMeasurementOptions,
  type MeasurementOptions
} from '@speckle/shared/viewer/state'

export function useSectionBoxUtilities() {
  const { instance } = useInjectedViewer()
  const {
    sectionBox,
    sectionBoxContext: { visible, edited },
    filters: { selectedObjects },
    threads: {
      openThread: { thread }
    }
  } = useInjectedViewerInterfaceState()

  const isSectionBoxEnabled = computed(() => !!sectionBox.value)
  const isSectionBoxVisible = computed(() => visible.value)
  const isSectionBoxEdited = computed(() => edited.value)

  /**
   * Converts a Box3 or OBB to SectionBoxData format
   */
  const box3ToSectionBoxData = (
    box: Box3 | OBB
  ): SpeckleViewer.ViewerState.SectionBoxData => {
    if (box instanceof Box3) {
      return {
        min: box.min.toArray(),
        max: box.max.toArray()
      }
    } else {
      // OBB case - calculate min/max from center and halfSize
      const min = box.center.clone().sub(box.halfSize)
      const max = box.center.clone().add(box.halfSize)

      return {
        min: min.toArray(),
        max: max.toArray(),
        ...(box.rotation && { rotation: box.rotation.toArray() })
      }
    }
  }

  /**
   * Converts SectionBoxData to Box3 or OBB format (reverse of box3ToSectionBoxData)
   */
  const sectionBoxDataToBox3 = (
    data: SpeckleViewer.ViewerState.SectionBoxData
  ): Box3 | OBB => {
    let box: Box3 | OBB

    if (!data.rotation || !data.rotation.length) {
      // No rotation, use Box3
      const min = new Vector3().fromArray(data.min)
      const max = new Vector3().fromArray(data.max)
      box = new Box3(min, max)
    } else {
      // Has rotation, create OBB
      box = new OBB()
      const min = new Vector3().fromArray(data.min)
      const max = new Vector3().fromArray(data.max)

      // Replicate the logic from OBB.prototype.min/max setters
      const _box3 = new Box3()
      _box3.set(min, max)
      _box3.getCenter(box.center)
      _box3.getSize(box.halfSize)
      box.halfSize.multiplyScalar(0.5)

      box.rotation = new Matrix3().fromArray(data.rotation)
    }

    return box
  }

  /**
   * Compares two SectionBoxData objects for equality with floating-point tolerance
   */
  const sectionBoxDataEquals = (
    a: SpeckleViewer.ViewerState.SectionBoxData,
    b: SpeckleViewer.ViewerState.SectionBoxData
  ): boolean => {
    return isEqualWith(a, b, (objValue, othValue) => {
      if (typeof objValue === 'number' && typeof othValue === 'number') {
        return Math.abs(objValue - othValue) < 1e-6
      }
      return undefined
    })
  }

  const resolveSectionBoxFromSelection = () => {
    const objectIds = selectedObjects.value.map((o) => o.id).filter(isNonNullable)
    const box = instance.getRenderer().boxFromObjects(objectIds)
    sectionBox.value = box3ToSectionBoxData(box)
  }

  const closeSectionBox = () => {
    visible.value = false
  }

  const toggleSectionBox = () => {
    if (!isSectionBoxEnabled.value) {
      resolveSectionBoxFromSelection()
      return
    }

    if (isSectionBoxVisible.value) {
      visible.value = false
    } else {
      visible.value = true
    }
  }

  const resetSectionBox = () => {
    const serializedSectionBox = thread.value?.viewerState?.ui.sectionBox
    sectionBox.value = null

    if (serializedSectionBox) {
      // Same logic we have in deserialization
      sectionBox.value = {
        min: serializedSectionBox.min,
        max: serializedSectionBox.max,
        rotation: serializedSectionBox.rotation
      }
    }
  }

  const resetSectionBoxCompletely = () => {
    sectionBox.value = null
    visible.value = false
  }

  return {
    isSectionBoxEnabled,
    isSectionBoxVisible,
    isSectionBoxEdited,
    toggleSectionBox,
    resetSectionBox,
    resetSectionBoxCompletely,
    sectionBox,
    closeSectionBox,
    box3ToSectionBoxData,
    sectionBoxDataToBox3,
    sectionBoxDataEquals
  }
}

export function useCameraUtilities() {
  const { instance } = useInjectedViewer()
  const {
    filters: { selectedObjects, isolatedObjectIds },
    camera
  } = useInjectedViewerInterfaceState()

  const cameraController = instance.getExtension(CameraController)

  const setView = (
    view: CanonicalView | InlineView | SpeckleView,
    transition = true
  ) => {
    cameraController.setCameraView(view, transition)
  }

  const zoomExtentsOrSelection = () => {
    const ids = selectedObjects.value.map((o) => o.id).filter(isNonNullable)

    if (ids.length > 0) {
      return cameraController.setCameraView(ids, true)
    }

    if (isolatedObjectIds.value.length) {
      return cameraController.setCameraView(isolatedObjectIds.value, true)
    }

    cameraController.setCameraView(undefined, true)
  }

  const toggleProjection = () => {
    camera.isOrthoProjection.value = !camera.isOrthoProjection.value
    cameraController.toggleCameras()
  }

  const forceViewToViewerSync = () => {
    setView(
      {
        position: camera.position.value,
        target: camera.target.value
      },
      true
    )
  }

  const zoom = (objectIds?: string[], fit?: number, transition?: boolean) => {
    cameraController.setCameraView(objectIds, transition, fit)
  }

  return {
    zoomExtentsOrSelection,
    toggleProjection,
    camera,
    setView,
    zoom,
    forceViewToViewerSync,
    cameraController
  }
}

export function useSelectionUtilities() {
  const {
    filters: { selectedObjects, selectedObjectIds }
  } = useInjectedViewerInterfaceState()
  const { metadata } = useInjectedViewer()

  const setSelectionFromObjectIds = (objectIds: string[]) => {
    const objs: Array<SpeckleObject> = []
    objectIds.forEach((value: string) => {
      objs.push(
        ...(
          (metadata?.worldTree.value?.findId(value) || []) as unknown as TreeNode[]
        ).map(
          (node: TreeNode) =>
            (node.model as Record<string, unknown>).raw as SpeckleObject
        )
      )
    })
    selectedObjects.value = objs
  }

  const addToSelectionFromObjectIds = (objectIds: string[]) => {
    const originalObjects = selectedObjects.value.slice()
    setSelectionFromObjectIds(objectIds)
    selectedObjects.value = [...originalObjects, ...selectedObjects.value]
  }

  const removeFromSelectionObjectIds = (objectIds: string[]) => {
    const finalObjects = selectedObjects.value.filter(
      (o) => !objectIds.includes(o.id || '')
    )
    selectedObjects.value = finalObjects
  }

  const addToSelection = (object: SpeckleObject) => {
    const idx = selectedObjects.value.findIndex((o) => o.id === object.id)
    if (idx !== -1) return

    selectedObjects.value = [...selectedObjects.value, object]
  }

  const removeFromSelection = (objectOrId: SpeckleObject | string) => {
    const oid = isString(objectOrId) ? objectOrId : objectOrId.id
    const idx = selectedObjects.value.findIndex((o) => o.id === oid)
    if (idx === -1) return

    const newObjects = selectedObjects.value.slice()
    newObjects.splice(idx, 1)
    selectedObjects.value = newObjects
  }

  const clearSelection = () => {
    selectedObjects.value = []
  }

  return {
    addToSelection,
    removeFromSelection,
    clearSelection,
    setSelectionFromObjectIds,
    addToSelectionFromObjectIds,
    removeFromSelectionObjectIds,
    objects: selectedObjects,
    objectIds: selectedObjectIds
  }
}

export function useDiffUtilities() {
  const state = useInjectedViewerState()
  const { serializeDiffCommand, deserializeDiffCommand, areDiffsEqual } =
    useDiffBuilderUtilities()

  const endDiff = async () => {
    await state.urlHashState.diff.update(null)
  }

  const diffModelVersions = async (
    modelId: string,
    versionA: string,
    versionB: string
  ) => {
    await state.urlHashState.diff.update({
      diffs: [
        {
          versionA: new SpeckleViewer.ViewerRoute.ViewerVersionResource(
            modelId,
            versionA
          ),
          versionB: new SpeckleViewer.ViewerRoute.ViewerVersionResource(
            modelId,
            versionB
          )
        }
      ]
    })
  }

  return {
    serializeDiffCommand,
    deserializeDiffCommand,
    endDiff,
    diffModelVersions,
    areDiffsEqual
  }
}

export function useThreadUtilities() {
  const {
    urlHashState: { focusedThreadId },
    ui: {
      threads: {
        openThread: { thread: openThread }
      }
    }
  } = useInjectedViewerState()

  const isOpenThread = (id: string) => focusedThreadId.value === id

  const closeAllThreads = async () => {
    await focusedThreadId.update(null)
  }

  const open = async (id: string) => {
    if (id === focusedThreadId.value) return
    await focusedThreadId.update(id)
    await Promise.all([
      until(focusedThreadId).toMatch((tid) => tid === id),
      until(openThread).toMatch((t) => t?.id === id)
    ])
  }

  return { closeAllThreads, open, isOpenThread }
}

export function useMeasurementUtilities() {
  const state = useInjectedViewerState()
  const measurementsExtension =
    state.viewer.instance.getExtension(MeasurementsExtension)

  const measurementOptions = computed(() => state.ui.measurement.options.value)
  const hasMeasurements = computed(
    () => state.ui.measurement.measurements.value.length > 0
  )

  const enableMeasurements = (enabled: boolean) => {
    state.ui.measurement.enabled.value = enabled
  }

  const setMeasurementOptions = (options: MeasurementOptions) => {
    state.ui.measurement.options.value = options
  }

  const removeActiveMeasurement = () => {
    measurementsExtension.removeMeasurement()
  }

  const clearMeasurements = () => {
    state.ui.measurement.measurements.value = []
  }

  const reset = () => {
    state.ui.measurement.enabled.value = false
    state.ui.measurement.measurements.value = []
    state.ui.measurement.options.value = { ...defaultMeasurementOptions }
  }

  return {
    measurementOptions,
    enableMeasurements,
    setMeasurementOptions,
    removeActiveMeasurement,
    clearMeasurements,
    hasMeasurements,
    reset,
    measurements: state.ui.measurement.measurements
  }
}

/**
 * Some conditional rendering values depend on multiple & overlapping states. This utility reconciles that.
 */
export function useConditionalViewerRendering() {
  const embedMode = useEmbedState()

  const showControls = computed(() => {
    if (
      embedMode.embedOptions.value?.isEnabled &&
      embedMode.embedOptions.value.hideControls
    ) {
      return false
    }

    return true
  })

  const showNavbar = computed(() => {
    if (!showControls.value) return false
    if (embedMode.embedOptions.value?.isEnabled) return false
    return true
  })

  return {
    showNavbar,
    showControls
  }
}

export function useHighlightedObjectsUtilities() {
  const {
    ui: { highlightedObjectIds },
    pageType
  } = useInjectedViewerState()

  const highlightObjects = (ids: string[]) => {
    if (pageType.value === ViewerRenderPageType.Presentation) return

    highlightedObjectIds.value = [...new Set([...highlightedObjectIds.value, ...ids])]
  }

  const unhighlightObjects = (ids: string[]) => {
    highlightedObjectIds.value = highlightedObjectIds.value.filter(
      (id) => !ids.includes(id)
    )
  }

  const clearHighlightedObjects = () => {
    highlightedObjectIds.value = []
  }

  return {
    highlightObjects,
    unhighlightObjects,
    clearHighlightedObjects
  }
}

export function useViewModeUtilities() {
  const { viewMode } = useInjectedViewerInterfaceState()
  const mp = useMixpanel()

  const setViewMode = (mode: ViewMode) => {
    viewMode.mode.value = mode
    mp.track('Viewer Action', {
      type: 'action',
      name: 'set-view-mode',
      mode
    })
  }

  const toggleEdgesEnabled = () => {
    viewMode.edgesEnabled.value = !viewMode.edgesEnabled.value
    mp.track('Viewer Action', {
      type: 'action',
      name: 'toggle-edges',
      enabled: viewMode.edgesEnabled.value
    })
  }

  const setEdgesWeight = (weight: number) => {
    viewMode.edgesWeight.value = Number(weight)
    mp.track('Viewer Action', {
      type: 'action',
      name: 'set-edges-weight',
      weight: viewMode.edgesWeight.value
    })
  }

  const setEdgesColor = (color: number | typeof defaultEdgeColorValue) => {
    viewMode.edgesColor.value = color
    mp.track('Viewer Action', {
      type: 'action',
      name: 'set-edges-color',
      color: color.toString(16).padStart(6, '0')
    })
  }

  return {
    viewMode,
    setViewMode,
    toggleEdgesEnabled,
    setEdgesWeight,
    setEdgesColor,
    resetViewMode: viewMode.resetViewMode
  }
}

export function useViewerShortcuts() {
  const { ui } = useInjectedViewerState()
  const { isSmallerOrEqualSm } = useIsSmallerOrEqualThanBreakpoint()
  const { isEnabled: isEmbedEnabled } = useEmbed()
  const activeElement = useActiveElement()

  const isTypingComment = computed(() => {
    if (
      activeElement.value &&
      (activeElement.value.tagName.toLowerCase() === 'input' ||
        activeElement.value.tagName.toLowerCase() === 'textarea' ||
        activeElement.value.getAttribute('contenteditable') === 'true')
    ) {
      return true
    }

    // Check thread editor states
    const isNewThreadEditorOpen = ui.threads.openThread.newThreadEditor.value
    const isExistingThreadEditorOpen = !!ui.threads.openThread.thread.value

    return isNewThreadEditorOpen || isExistingThreadEditorOpen
  })

  const formatKey = (key: string) => {
    if (key.startsWith('Digit')) {
      return key.slice(5)
    }
    return key
  }

  const getShortcutDisplayText = (
    shortcut: ViewerShortcut,
    options?: { hideName?: boolean; format?: 'default' | 'separate' }
  ) => {
    if (isSmallerOrEqualSm.value) return undefined
    if (isEmbedEnabled.value) return undefined

    const shortcutText = getKeyboardShortcutTitle([
      ...shortcut.modifiers,
      formatKey(shortcut.key)
    ])

    if (options?.format === 'separate') {
      const modifiersText =
        shortcut.modifiers.length > 0
          ? getKeyboardShortcutTitle([...shortcut.modifiers])
          : ''
      const keyText = getKeyboardShortcutTitle([formatKey(shortcut.key)])

      return {
        content: `
        <div class="flex flex-row gap-2 m-0 p-0">
          <div class="text-body-2xs text-foreground">${shortcut.name}</div>
          <div class="text-body-3xs text-foreground-3">
            ${
              modifiersText
                ? `<kbd class="p-0.5 min-w-4 text-foreground-2 rounded-md text-body-3xs font-normal font-sans">${modifiersText}</kbd>`
                : ''
            }<kbd class="min-w-3 text-foreground-2 rounded-sm text-body-3xs font-sans">${keyText}</kbd>
          </div>
        </div>
      `,
        allowHTML: true,
        theme: 'speckleTooltip'
      }
    }

    if (!options?.hideName) {
      return `${shortcut.name} (${shortcutText})`
    }

    return shortcutText
  }

  const disableShortcuts = computed(() => isTypingComment.value || isEmbedEnabled.value)

  const registerShortcuts = (
    handlers: Partial<Record<ViewerShortcutAction, () => void>>
  ) => {
    Object.values(ViewerShortcuts).forEach((shortcut) => {
      const handler = handlers[shortcut.action as ViewerShortcutAction]
      if (handler) {
        onKeyboardShortcut([...shortcut.modifiers], shortcut.key, () => {
          if (!disableShortcuts.value) handler()
        })
      }
    })
  }

  return {
    shortcuts: ViewerShortcuts,
    registerShortcuts,
    getShortcutDisplayText
  }
}
