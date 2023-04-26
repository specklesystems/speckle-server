import { PropertyInfo } from '@speckle/viewer'
import { difference, isString, uniq } from 'lodash-es'
import { SpeckleObject } from '~~/lib/common/helpers/sceneExplorer'
import { isNonNullable } from '~~/lib/common/helpers/utils'
import {
  useInjectedViewer,
  useInjectedViewerInterfaceState
} from '~~/lib/viewer/composables/setup'

export function useSectionBoxUtilities() {
  const { instance } = useInjectedViewer()
  const {
    sectionBox,
    filters: { selectedObjects }
  } = useInjectedViewerInterfaceState()

  const isSectionBoxEnabled = computed(() => !!sectionBox.value)
  const toggleSectionBox = () => {
    if (isSectionBoxEnabled.value) {
      sectionBox.value = null
      return
    }

    const objectIds = selectedObjects.value.map((o) => o.id).filter(isNonNullable)
    const box = instance.getSectionBoxFromObjects(objectIds)
    sectionBox.value = box
  }
  const sectionBoxOn = () => {
    if (!isSectionBoxEnabled.value) {
      toggleSectionBox()
    }
  }
  const sectionBoxOff = () => {
    sectionBox.value = null
  }

  return {
    isSectionBoxEnabled,
    toggleSectionBox,
    sectionBoxOn,
    sectionBoxOff,
    sectionBox
  }
}

export function useCameraUtilities() {
  const { instance } = useInjectedViewer()
  const {
    filters: { selectedObjects, isolatedObjectIds },
    camera
  } = useInjectedViewerInterfaceState()

  const zoom = (...args: Parameters<typeof instance.zoom>) => instance.zoom(...args)

  const setView = (...args: Parameters<typeof instance.setView>) => {
    instance.setView(...args)
  }

  const truck = (...args: Parameters<typeof instance.cameraHandler.controls.truck>) =>
    instance.cameraHandler.controls.truck(...args)

  const zoomExtentsOrSelection = () => {
    const ids = selectedObjects.value.map((o) => o.id).filter(isNonNullable)

    if (ids.length > 0) {
      return instance.zoom(ids)
    }

    if (isolatedObjectIds.value.length) {
      return instance.zoom(isolatedObjectIds.value)
    }

    instance.zoom()
  }

  const toggleProjection = () => {
    camera.isOrthoProjection.value = !camera.isOrthoProjection.value
  }

  return { zoomExtentsOrSelection, toggleProjection, camera, truck, setView, zoom }
}

export function useFilterUtilities() {
  // const { instance } = useInjectedViewer()
  const { filters } = useInjectedViewerInterfaceState()

  const isolateObjects = (objectIds: string[]) => {
    filters.isolatedObjectIds.value = uniq([
      ...filters.isolatedObjectIds.value,
      ...objectIds
    ])
    // instance.isolateObjects(objectIds, 'utilities', true)
  }

  const unIsolateObjects = (objectIds: string[]) => {
    filters.isolatedObjectIds.value = difference(
      filters.isolatedObjectIds.value,
      objectIds
    )
    // instance.unIsolateObjects(objectIds, 'utilities', true)
  }

  const hideObjects = (objectIds: string[]) => {
    filters.hiddenObjectIds.value = uniq([
      ...filters.hiddenObjectIds.value,
      ...objectIds
    ])
    // instance.hideObjects(objectIds, 'utilities', true)
  }

  const showObjects = (objectIds: string[]) => {
    filters.hiddenObjectIds.value = difference(filters.hiddenObjectIds.value, objectIds)
    // instance.showObjects(objectIds, 'utilities', true)
  }

  const setPropertyFilter = (property: PropertyInfo) => {
    filters.propertyFilter.filter.value = property
  }

  const removePropertyFilter = () => {
    filters.propertyFilter.filter.value = null
  }

  const resetFilters = () => {
    filters.hiddenObjectIds.value = []
    filters.isolatedObjectIds.value = []
    filters.propertyFilter.filter.value = null
    filters.propertyFilter.isApplied.value = false
    // filters.selectedObjects.value = []
  }

  return {
    isolateObjects,
    unIsolateObjects,
    hideObjects,
    showObjects,
    filters,
    setPropertyFilter,
    removePropertyFilter,
    resetFilters
  }
}

export function useSelectionUtilities() {
  const {
    filters: { selectedObjects }
  } = useInjectedViewerInterfaceState()
  const {
    metadata: { worldTree }
  } = useInjectedViewer()

  const setSelectionFromObjectIds = (objectIds: string[]) => {
    const res = worldTree.value
      ? worldTree.value.findAll((node) => {
          const t = node.model as Record<string, unknown>
          const raw = t.raw as Record<string, unknown>
          const id = raw.id as string
          if (!raw || !id) return false
          if (objectIds.includes(id)) return true
          return false
        })
      : []

    const objs = res.map(
      (node) => (node.model as Record<string, unknown>).raw as SpeckleObject
    )
    selectedObjects.value = objs
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
    objects: selectedObjects
  }
}
