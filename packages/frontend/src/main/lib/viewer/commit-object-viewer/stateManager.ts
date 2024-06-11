// NOTE: any disabling temporary, most of the filtering stuff will go away

import { Nullable } from '@/helpers/typeHelpers'
import { setupNewViewerInjection } from '@/main/lib/viewer/core/composables/viewer'
import {
  DefaultViewerParams,
  Viewer,
  SelectionEvent,
  PropertyInfo,
  NumericPropertyInfo
} from '@speckle/viewer'
import { cloneDeep } from 'lodash'
import { computed, ComputedRef, inject, InjectionKey, provide, Ref } from 'vue'
import {
  commitObjectViewerState,
  StateType
} from '@/main/lib/viewer/commit-object-viewer/stateManagerCore'

const ViewerStreamIdKey: InjectionKey<Ref<string>> = Symbol(
  'COMMIT_OBJECT_VIEWER_STREAMID'
)
const ViewerResourceIdKey: InjectionKey<Ref<string>> = Symbol(
  'COMMIT_OBJECT_VIEWER_RESOURCEID'
)
const ViewerIsEmbedKey: InjectionKey<Ref<boolean>> = Symbol(
  'COMMIT_OBJECT_VIEWER_IS_EMBED'
)

type UnknownObject = Record<string, unknown>

type GlobalViewerData = {
  viewer: Viewer
  container: HTMLElement
  initialized: Promise<void>
}

/**
 * Global CommitObjectViewer viewer instance & container. It's not held in commitObjectViewerState, because it's a
 * complex object that keeps mutating itself (triggering Apollo Client errors)
 */
let globalViewerData: Nullable<GlobalViewerData> = null

export type LocalFilterState = {
  hiddenIds?: string[]
  isolatedIds?: string[]
  propertyInfoKey?: string
  passMin?: number | null
  passMax?: number | null
  sectionBox?: number[]
}

/**
 * Get current global Commit Object Viewer instance or create one
 */
function getOrInitViewerData(): GlobalViewerData {
  if (globalViewerData) return globalViewerData

  const container = document.createElement('div')
  container.id = 'renderer'
  container.className = 'viewer-container'
  container.style.display = 'inline-block'

  const viewer = new Viewer(container, DefaultViewerParams)
  const initPromise = viewer.init()

  globalViewerData = {
    viewer,
    container,
    initialized: initPromise
  }

  return globalViewerData
}

function getInitializedViewer(): Viewer {
  if (!globalViewerData?.viewer) {
    throw new Error('Attempting to access viewer before it has been initialized')
  }

  return globalViewerData.viewer
}

/**
 * Composable that returns the global Commit Object Viewer instance and injects it into child components
 */
export function setupCommitObjectViewer(reactiveMainProps: {
  streamId: Ref<string>
  resourceId: Ref<string>
  isEmbed: Ref<boolean>
}) {
  const { streamId, resourceId, isEmbed } = reactiveMainProps

  // Set up and inject viewer
  const viewerData = getOrInitViewerData()
  const { viewer, container, isInitialized, isInitializedPromise } =
    setupNewViewerInjection({
      viewer: viewerData.viewer,
      container: viewerData.container,
      initPromise: viewerData.initialized
    })

  // Inject main parameters into child components
  provide(ViewerStreamIdKey, streamId)
  provide(ViewerResourceIdKey, resourceId)
  provide(ViewerIsEmbedKey, isEmbed)

  return { viewer, container, isInitialized, isInitializedPromise }
}

/**
 * Inject the Commit Object Viewer instance's main parameters
 */
export function useCommitObjectViewerParams() {
  const injectedStreamId = inject(ViewerStreamIdKey)
  const injectedResourceId = inject(ViewerResourceIdKey)
  const injectedIsEmbed = inject(ViewerIsEmbedKey)

  const buildSafeRef = <T>(ref: Ref<T> | undefined): ComputedRef<T> =>
    computed(() => {
      if (!ref) {
        throw new Error(
          "Couldn't resolve Commit Object Viewer injected state! Is it properly set up??"
        )
      }

      return ref.value
    })

  const streamId = buildSafeRef(injectedStreamId)
  const resourceId = buildSafeRef(injectedResourceId)
  const isEmbed = buildSafeRef(injectedIsEmbed)

  return { streamId, resourceId, isEmbed }
}

/*
 * STATE MODIFICATION FUNCTIONS:
 */

function updateState(newValues: Partial<StateType>) {
  commitObjectViewerState({
    ...commitObjectViewerState(),
    ...newValues
  })
}

export function setIsViewerBusy(isBusy: boolean) {
  updateState({ viewerBusy: isBusy })
}

export function setIsAddingComment(isAddingComment: boolean) {
  updateState({ addingComment: isAddingComment })
}

/**
 * Note: We should not set the entire comment here, because we mutate comments in multiple places
 * and that would cause a cache mutation
 */
export function setSelectedCommentMetaData(
  comment: { id: number; data: { location: Record<string, unknown> } } | null
) {
  updateState({
    selectedCommentMetaData: comment
      ? {
          id: comment.id,
          // deep cloning to avoid cache mutation
          selectionLocation: comment.data.location
            ? cloneDeep(comment.data.location)
            : {}
        }
      : null
  })
}

export function setPreventCommentCollapse(shouldPrevent: boolean) {
  updateState({
    preventCommentCollapse: shouldPrevent
  })
}

// VIEWER

/**
 *
 * @returns A bare minimum filtering state object for storing with comments or plopping in the url.
 */
export function getLocalFilterState(): LocalFilterState {
  const state = { ...commitObjectViewerState() }
  const fs = {} as LocalFilterState
  fs.hiddenIds = state.currentFilterState?.hiddenObjects
  fs.isolatedIds = state.currentFilterState?.isolatedObjects
  fs.propertyInfoKey = state.currentFilterState?.activePropFilterKey
  fs.passMax = state.currentFilterState?.passMax
  fs.passMin = state.currentFilterState?.passMin
  const box = getInitializedViewer().getCurrentSectionBox()
  if (box) {
    fs.sectionBox = [
      +box.min.x.toFixed(2),
      +box.min.y.toFixed(2),
      +box.min.z.toFixed(2),
      +box.max.x.toFixed(2),
      +box.max.y.toFixed(2),
      +box.max.z.toFixed(2)
    ]
  }
  return fs
}

export function setSectionBox(
  box?: {
    min: { x: number; y: number; z: number }
    max: { x: number; y: number; z: number }
  },
  offset?: number
) {
  getInitializedViewer().setSectionBox(box, offset)
}

export function setSectionBoxFromObjects(objectIds: string[], offset?: number) {
  getInitializedViewer().setSectionBoxFromObjects(objectIds, offset)
}

export function toggleSectionBox() {
  getInitializedViewer().toggleSectionBox()
  updateState({ sectionBox: getInitializedViewer().getCurrentSectionBox() !== null })
}

export function sectionBoxOff() {
  getInitializedViewer().sectionBoxOff()
  updateState({ sectionBox: false })
}

export function sectionBoxOn() {
  getInitializedViewer().sectionBoxOn()
  updateState({ sectionBox: true })
}

export function loadObjectProperties() {
  setIsViewerBusy(true)
  const props = getInitializedViewer().getObjectProperties(undefined, true)
  setIsViewerBusy(false)
  updateState({ objectProperties: props })
}

export async function handleViewerSelection(selectionInfo: SelectionEvent) {
  const state = { ...commitObjectViewerState() }
  const firstVisibleHit = selectionInfo
    ? getFirstVisibleSelectionHit(selectionInfo)
    : null

  if (!selectionInfo || !firstVisibleHit) {
    updateState({ selectedObjects: [] })
    await getInitializedViewer().resetSelection()
    return
  }

  if (selectionInfo.multiple) {
    if (!state.selectedObjects.includes(firstVisibleHit.object))
      state.selectedObjects = [...state.selectedObjects, firstVisibleHit.object]
  } else {
    state.selectedObjects = [firstVisibleHit.object]
  }

  getInitializedViewer().selectObjects(
    state.selectedObjects.map((o) => o.id) as string[]
  )
  updateState(state)
}

export async function handleViewerDoubleClick(selectionInfo: SelectionEvent) {
  if (!selectionInfo) {
    await getInitializedViewer().zoom()
    return
  }

  const firstVisibleHit = getFirstVisibleSelectionHit(selectionInfo)
  if (!firstVisibleHit) return

  await getInitializedViewer().zoom([firstVisibleHit.object.id])
}

function getFirstVisibleSelectionHit({ hits }: SelectionEvent) {
  const { currentFilterState } = { ...commitObjectViewerState() }
  const hasHiddenObjects =
    !!currentFilterState?.hiddenObjects &&
    currentFilterState?.hiddenObjects.length !== 0
  const hasIsolatedObjects =
    !!currentFilterState?.isolatedObjects &&
    currentFilterState?.isolatedObjects.length !== 0

  for (const hit of hits) {
    if (hasHiddenObjects) {
      if (!currentFilterState?.hiddenObjects?.includes(hit.object.id)) {
        return hit
      }
    } else if (hasIsolatedObjects) {
      if (currentFilterState.isolatedObjects?.includes(hit.object.id)) return hit
    } else {
      return hit
    }
  }
  return null
}

export async function clearSelectionDisplay() {
  await getInitializedViewer().resetSelection()
}

export async function resetSelection() {
  updateState({ selectedObjects: [] })
  await getInitializedViewer().resetSelection()
}

export async function highlightObjects(objectIds: string[], ghost = false) {
  await getInitializedViewer().highlightObjects(objectIds, ghost)
}

export async function removeHighlights() {
  await getInitializedViewer().resetHighlight()
}

// FILTERING NEW

export async function isolateObjects(
  objectIds: string[],
  stateKey: string,
  includeDescendants = false
) {
  setIsViewerBusy(true)
  const result = await getInitializedViewer().isolateObjects(
    objectIds,
    stateKey,
    includeDescendants
  )
  updateState({ currentFilterState: result })
  setIsViewerBusy(false)
}

export async function unIsolateObjects(
  objectIds: string[],
  stateKey: string,
  includeDescendants = false
) {
  setIsViewerBusy(true)
  const result = await getInitializedViewer().unIsolateObjects(
    objectIds,
    stateKey,
    includeDescendants
  )
  updateState({ currentFilterState: result })
  setIsViewerBusy(false)
}

export async function hideObjects(
  objectIds: string[],
  stateKey: string,
  includeDescendants = false
) {
  setIsViewerBusy(true)
  const result = await getInitializedViewer().hideObjects(
    objectIds,
    stateKey,
    includeDescendants
  )
  updateState({ currentFilterState: result })
  setIsViewerBusy(false)
}

export async function showObjects(
  objectIds: string[],
  stateKey: string,
  includeDescendants = false
) {
  setIsViewerBusy(true)
  const result = await getInitializedViewer().showObjects(
    objectIds,
    stateKey,
    includeDescendants
  )
  updateState({ currentFilterState: result })
  setIsViewerBusy(false)
}

export async function setColorFilter(property: PropertyInfo) {
  setIsViewerBusy(true)
  const result = await getInitializedViewer().setColorFilter(property)
  updateState({ currentFilterState: result, localFilterPropKey: property.key })
  setIsViewerBusy(false)
}

// FILTERING OLD

type FilterByValue =
  | {
      gte: number
      lte: number
    }
  | string[]
  | { not: string[] }

export type Filter = {
  filterBy?: {
    __parents?: {
      includes?: string[]
      excludes?: string[]
    }
  } & {
    [by: string]: FilterByValue
  }
  colorBy?: {
    type: string
    property: string
  }
  ghostOthers?: boolean
}

function isLegacyFilter(obj: UnknownObject) {
  const keys = Object.keys(obj)
  return (
    keys.includes('filterBy') ||
    keys.includes('colorBy') ||
    keys.includes('ghostOhters')
  )
}

export async function setFilterDirectly(params: { filter: Filter | LocalFilterState }) {
  await resetFilter()

  // Minimal support for legacy filters (old viewer filtering api)
  if (isLegacyFilter(params.filter)) {
    console.warn('Legacy filter type detected. Things might not appear as expected.')
    const legacyFilter = params.filter as Filter
    if (legacyFilter.colorBy) {
      const { objectProperties } = { ...commitObjectViewerState() }
      const prop = {
        ...objectProperties.find((p) => p.key === legacyFilter.colorBy?.property)
      } as PropertyInfo

      if (!prop) return
      if ((legacyFilter.colorBy as Record<string, unknown>).maxValue) {
        ;(prop as NumericPropertyInfo).passMax = (
          legacyFilter.colorBy as Record<string, unknown>
        ).maxValue as number
      }

      if ((legacyFilter.colorBy as Record<string, unknown>).minValue) {
        ;(prop as NumericPropertyInfo).passMin = (
          legacyFilter.colorBy as Record<string, unknown>
        ).minValue as number
      }

      if (prop) {
        setColorFilter(prop)
        return
      }
    }

    if (legacyFilter.filterBy?.__parents?.includes) {
      isolateObjects(legacyFilter.filterBy?.__parents?.includes, 'setfilter-direct')
    }

    if (legacyFilter.filterBy?.__parents?.excludes) {
      hideObjects(legacyFilter.filterBy?.__parents?.excludes, 'setfilter-direct')
    }

    return
  }

  // Current filters
  const lfs = params.filter as LocalFilterState

  if (lfs.hiddenIds) {
    hideObjects(lfs.hiddenIds, 'setfilter-direct', false)
  }
  if (lfs.isolatedIds) {
    isolateObjects(lfs.isolatedIds, 'setfilter-direct', false)
  }
  if (lfs.propertyInfoKey) {
    const { objectProperties } = { ...commitObjectViewerState() }
    const prop = { ...objectProperties.find((p) => p.key === lfs.propertyInfoKey) }

    if (lfs.passMax) {
      ;(prop as NumericPropertyInfo).passMax = lfs.passMax
    }
    if (lfs.passMin) {
      ;(prop as NumericPropertyInfo).passMin = lfs.passMin
    }

    if (prop) {
      setColorFilter(prop as NumericPropertyInfo)
      // TODO: set active filter key or something
    } else console.warn(`${lfs.propertyInfoKey} property not found.`)
  }

  if (lfs.sectionBox) {
    const box = {
      min: { x: lfs.sectionBox[0], y: lfs.sectionBox[1], z: lfs.sectionBox[2] },
      max: { x: lfs.sectionBox[3], y: lfs.sectionBox[4], z: lfs.sectionBox[5] }
    }
    setSectionBox(box)
    sectionBoxOn()
  }
}

export async function resetFilter() {
  const viewer = getInitializedViewer()

  updateState({
    preventCommentCollapse: true,
    currentFilterState: null,
    localFilterPropKey: null
  })

  await viewer.resetFilters()
  viewer.applyFilter(null)
}
