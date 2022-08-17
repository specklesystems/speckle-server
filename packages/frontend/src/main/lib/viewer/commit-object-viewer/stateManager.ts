/* eslint-disable  @typescript-eslint/no-explicit-any */
// NOTE: any disabling temporary, most of the filtering stuff will go away

import { GetReactiveVarType, Nullable } from '@/helpers/typeHelpers'
import { setupNewViewerInjection } from '@/main/lib/viewer/core/composables/viewer'
import { makeVar, TypePolicies } from '@apollo/client/cache'
import { DefaultViewerParams, Viewer, SelectionEvent } from '@speckle/viewer'
import emojis from '@/main/store/emojis'
import { cloneDeep, has, isArray, update } from 'lodash'
import { computed, ComputedRef, inject, InjectionKey, provide, Ref } from 'vue'

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

type FilterKeyAndValues = {
  filterKey: string
  filterValues: string[]
}

/**
 * Global CommitObjectViewer viewer instance & container. It's not held in commitObjectViewerState, because it's a
 * complex object that keeps mutating itself (triggering Apollo Client errors)
 */
let globalViewerData: Nullable<GlobalViewerData> = null

/**
 * Queryable Apollo Client state
 */
const commitObjectViewerState = makeVar({
  viewerBusy: false,
  appliedFilter: null as Nullable<UnknownObject>,
  isolateKey: null as Nullable<string>,
  isolateValues: [] as string[],
  hideKey: null as Nullable<string>,
  hideValues: [] as string[],
  colorLegend: {} as UnknownObject,
  isolateCategoryKey: null as Nullable<string>,
  isolateCategoryValues: [] as string[],
  hideCategoryKey: null as Nullable<string>,
  hideCategoryValues: [] as string[],
  selectedCommentMetaData: null as Nullable<{
    id: number
    selectionLocation: Record<string, unknown>
  }>,
  addingComment: false,
  preventCommentCollapse: false,
  commentReactions: ['❤️', '✏️', '🔥', '⚠️'],
  emojis,
  // TODO: new filtering shit
  currentFilterState: null as Nullable<UnknownObject>,
  selectedObjects: [] as UnknownObject[]
})

export type StateType = GetReactiveVarType<typeof commitObjectViewerState>

/**
 * Merge (through _.merge) these with the rest of your Apollo Client `typePolicies` to set up
 * commit object viewer state management
 */
export const statePolicies: TypePolicies = {
  Query: {
    fields: {
      commitObjectViewerState: {
        read() {
          return commitObjectViewerState()
        }
      }
    }
  }
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

export function getInitializedViewer(): Viewer {
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

export function handleViewerSelection(selectionInfo: SelectionEvent) {
  if (!selectionInfo) {
    updateState({ selectedObjects: [] })
    getInitializedViewer().FilteringManager.resetSelection()
    return
  }

  const state = { ...commitObjectViewerState() }

  if (selectionInfo.multiple) {
    if (!state.selectedObjects.includes(selectionInfo.userData))
      state.selectedObjects = [...state.selectedObjects, selectionInfo.userData]
  } else {
    state.selectedObjects = [selectionInfo.userData]
  }

  getInitializedViewer().FilteringManager.selectObjects(
    state.selectedObjects.map((o) => o.id) as string[]
  )
  updateState(state)
}

export function clearSelectionDisplay() {
  getInitializedViewer().FilteringManager.resetSelection()
}

export function resetSelection() {
  updateState({ selectedObjects: [] })
  getInitializedViewer().FilteringManager.resetSelection()
}

// FILTERING NEW

export function isolateObjects2(
  objectIds: string[],
  filterKey: string,
  resourceUrl: string,
  ghost = false
) {
  const result = getInitializedViewer().FilteringManager.isolateObjects(
    objectIds,
    filterKey,
    resourceUrl,
    ghost
  )
  const state = { ...commitObjectViewerState() }
  state.currentFilterState = result
  console.log(result)
  updateState(state)
}

export function unIsolateObjects2(
  objectIds: string[],
  filterKey: string,
  resourceUrl: string,
  ghost = false
) {
  const result = getInitializedViewer().FilteringManager.unIsolateObjects(
    objectIds,
    filterKey,
    resourceUrl,
    ghost
  )
  updateState({ currentFilterState: result })
}

export function hideTree(
  objectId: string,
  filterKey: string,
  resourceUrl: string,
  ghost = false
) {
  const result = getInitializedViewer().FilteringManager.hideTree(
    objectId,
    filterKey,
    resourceUrl,
    ghost
  )
  updateState({ currentFilterState: result })
}

export function showTree(objectId: string, filterKey: string, resourceUrl: string) {
  const result = getInitializedViewer().FilteringManager.showTree(
    objectId,
    filterKey,
    resourceUrl
  )
  updateState({ currentFilterState: result })
}

export function hideObjects2(
  objectIds: string[],
  filterKey: string,
  resourceUrl: string,
  ghost = false
) {
  const result = getInitializedViewer().FilteringManager.hideObjects(
    objectIds,
    filterKey,
    resourceUrl,
    ghost
  )
  updateState({ currentFilterState: result })
}

export function showObjects2(
  objectIds: string[],
  filterKey: string,
  resourceUrl: string
) {
  const result = getInitializedViewer().FilteringManager.showObjects(
    objectIds,
    filterKey,
    resourceUrl
  )
  const state = { ...commitObjectViewerState() }
  state.currentFilterState = result
  updateState(state)
}

// FILTERING OLD

export function isolateObjects(params: FilterKeyAndValues) {
  const { filterKey, filterValues } = params

  const state = { ...commitObjectViewerState() }
  state.hideKey = null
  state.hideValues = []
  if (state.isolateKey !== filterKey) {
    state.isolateValues = []
  }

  state.isolateKey = filterKey
  state.isolateValues = [...new Set([...state.isolateValues, ...filterValues])]
  if (state.isolateValues.length === 0) {
    state.appliedFilter = null
  } else {
    state.appliedFilter = {
      filterBy: { [filterKey]: { includes: state.isolateValues } },
      ghostOthers: true
    }
  }

  updateState(state)
  getInitializedViewer().applyFilter(state.appliedFilter)
}

export function unisolateObjects(params: FilterKeyAndValues) {
  const { filterKey, filterValues } = params

  const state = { ...commitObjectViewerState() }
  state.hideKey = null
  state.hideValues = []
  if (state.isolateKey !== filterKey) {
    state.isolateValues = []
  }

  state.isolateKey = filterKey
  state.isolateValues = state.isolateValues.filter(
    (val) => filterValues.indexOf(val) === -1
  )
  if (state.isolateValues.length === 0) {
    state.appliedFilter = null
  } else {
    state.appliedFilter = {
      filterBy: { [filterKey]: { includes: state.isolateValues } },
      ghostOthers: true
    }
  }

  updateState(state)
  getInitializedViewer().applyFilter(state.appliedFilter)
}

export function hideObjects(params: FilterKeyAndValues) {
  const { filterKey, filterValues } = params
  const state = { ...commitObjectViewerState() }

  state.isolateKey = null
  state.isolateValues = []
  if (state.hideKey !== filterKey) {
    state.hideValues = []
  }

  state.hideKey = filterKey
  state.hideValues = [...new Set([...filterValues, ...state.hideValues])]

  if (state.hideValues.length === 0) {
    state.appliedFilter = null
  } else {
    state.appliedFilter = {
      filterBy: { [filterKey]: { excludes: state.hideValues } }
    }
  }

  updateState(state)
  getInitializedViewer().applyFilter(state.appliedFilter)
}

export function showObjects(params: FilterKeyAndValues) {
  const { filterKey, filterValues } = params
  const state = { ...commitObjectViewerState() }

  state.isolateKey = null
  state.isolateValues = []
  if (state.hideKey !== filterKey) {
    state.hideValues = []
  }

  state.hideKey = filterKey
  state.hideValues = state.hideValues.filter((val) => filterValues.indexOf(val) === -1)

  if (state.hideValues.length === 0) {
    state.appliedFilter = null
  } else {
    state.appliedFilter = {
      filterBy: { [filterKey]: { excludes: state.hideValues } }
    }
  }

  updateState(state)
  getInitializedViewer().applyFilter(state.appliedFilter)
}

function resetInternalHideIsolateObjectState() {
  updateState({
    isolateKey: null,
    isolateValues: [],
    hideKey: null,
    hideValues: []
  })
}

export async function isolateCategoryToggle(params: {
  filterKey: string
  filterValue: string
  allValues: string[]
  colorBy?: Record<string, unknown> | false
}) {
  resetInternalHideIsolateObjectState()

  const { filterKey, filterValue, allValues, colorBy = false } = params
  const state = { ...commitObjectViewerState() }
  const viewer = getInitializedViewer()

  state.hideCategoryKey = null
  state.hideCategoryValues = []

  if (filterKey !== state.isolateCategoryKey) {
    state.isolateCategoryValues = []
  }
  state.isolateCategoryKey = filterKey

  const isolateCategoryValues = [...state.isolateCategoryValues]
  const indx = isolateCategoryValues.indexOf(filterValue)
  if (indx === -1) {
    isolateCategoryValues.push(filterValue)
  } else {
    isolateCategoryValues.splice(indx, 1)
  }
  state.isolateCategoryValues = isolateCategoryValues

  if (
    (state.isolateCategoryValues.length === 0 ||
      state.isolateCategoryValues.length === allValues.length) &&
    !colorBy
  ) {
    state.appliedFilter = null
    updateState(state)
    viewer.applyFilter(state.appliedFilter)
    return
  }

  if (state.isolateCategoryValues.length === 0 && colorBy) {
    state.appliedFilter = {
      colorBy: { type: 'category', property: filterKey }
    }
  }
  if (state.isolateCategoryValues.length !== 0) {
    state.appliedFilter = {
      ghostOthers: true,
      filterBy: { [filterKey]: state.isolateCategoryValues },
      colorBy: colorBy ? { type: 'category', property: filterKey } : null
    }
  }

  if (
    state.isolateCategoryValues.length === allValues.length &&
    state.appliedFilter?.filterBy
  ) {
    const newAppliedFilter = { ...state.appliedFilter }
    delete newAppliedFilter.filterBy

    state.appliedFilter = newAppliedFilter
  }

  const res = (await viewer.applyFilter(state.appliedFilter)) as any
  state.colorLegend = res.colorLegend
  updateState(state)
}

export async function hideCategoryToggle(params: {
  filterKey: string
  filterValue: string
  colorBy?: Record<string, unknown> | false
}) {
  resetInternalHideIsolateObjectState()

  const { filterKey, filterValue, colorBy = false } = params
  const state = { ...commitObjectViewerState() }
  const viewer = getInitializedViewer()

  state.isolateCategoryKey = null
  state.isolateCategoryValues = []
  if (filterKey !== state.hideCategoryKey) {
    state.hideCategoryValues = []
  }
  state.hideCategoryKey = filterKey

  const hideCategoryValues = [...state.hideCategoryValues]
  const indx = hideCategoryValues.indexOf(filterValue)
  if (indx === -1) {
    hideCategoryValues.push(filterValue)
  } else {
    hideCategoryValues.splice(indx, 1)
  }
  state.hideCategoryValues = hideCategoryValues

  if (state.hideCategoryValues.length === 0 && !colorBy) {
    state.appliedFilter = null
    updateState(state)
    viewer.applyFilter(state.appliedFilter)
    return
  }

  if (state.hideCategoryValues.length === 0 && colorBy) {
    state.appliedFilter = {
      colorBy: { type: 'category', property: filterKey }
    }
  }
  if (state.hideCategoryValues.length !== 0) {
    state.appliedFilter = {
      filterBy: { [filterKey]: { not: state.hideCategoryValues } },
      colorBy: colorBy ? { type: 'category', property: filterKey } : null
    }
  }
  const res = (await viewer.applyFilter(state.appliedFilter)) as any
  state.colorLegend = res.colorLegend
  updateState(state)
}

export async function toggleColorByCategory(params: { filterKey: string }) {
  const { filterKey } = params
  const state = { ...commitObjectViewerState() }
  const viewer = getInitializedViewer()

  if (state.appliedFilter && state.appliedFilter.colorBy) {
    state.appliedFilter = {
      ...state.appliedFilter,
      colorBy: null
    }
  } else {
    state.appliedFilter = {
      ...state.appliedFilter,
      colorBy: { type: 'category', property: filterKey }
    }
  }
  const res = (await viewer.applyFilter(state.appliedFilter)) as any
  state.colorLegend = res.colorLegend
  updateState(state)
}

function resetInternalCategoryObjectState() {
  updateState({
    isolateCategoryKey: null,
    isolateCategoryValues: [],
    hideCategoryKey: null,
    hideCategoryValues: []
  })
}

export function setNumericFilter(params: {
  filterKey: string
  minValue: number
  maxValue: number
  gradientColors?: string[]
}) {
  resetInternalHideIsolateObjectState()
  resetInternalCategoryObjectState()

  const {
    filterKey,
    minValue,
    maxValue,
    gradientColors = ['#3F5EFB', '#FC466B']
  } = params
  const state = { ...commitObjectViewerState() }
  const viewer = getInitializedViewer()

  state.appliedFilter = {
    ghostOthers: true,
    colorBy: {
      type: 'gradient',
      property: filterKey,
      minValue,
      maxValue,
      gradientColors
    },
    filterBy: { [filterKey]: { gte: minValue, lte: maxValue } }
  }

  updateState(state)
  viewer.applyFilter(state.appliedFilter)
}

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

export async function setFilterDirectly(params: { filter: Filter }) {
  const { filter } = params

  const isNotFilter = (filterByVal: FilterByValue): filterByVal is { not: string[] } =>
    has(filterByVal, 'not')

  const filterBy = filter.filterBy
  if (filterBy && filterBy.__parents) {
    if (filterBy.__parents.includes) {
      isolateObjects({
        filterKey: '__parents',
        filterValues: filterBy.__parents.includes
      })
      return
    }
    if (filterBy.__parents.excludes) {
      hideObjects({
        filterKey: '__parents',
        filterValues: filterBy.__parents.excludes
      })
      return
    }
  } else if (filter.ghostOthers && filterBy) {
    // means it's isolate by category or numeric filter
    const filterByKey = Object.keys(filterBy || {})[0]
    const filterVal = filterBy[filterByKey]

    if (
      filter.colorBy &&
      filter.colorBy.type === 'gradient' &&
      !isArray(filterVal) &&
      !isNotFilter(filterVal)
    ) {
      setNumericFilter({
        filterKey: filterByKey,
        minValue: filterVal.gte,
        maxValue: filterVal.lte
      })
    } else if (isArray(filterVal)) {
      for (const val of filterVal) {
        const f = {
          filterKey: filterByKey,
          filterValue: val,
          allValues: [],
          colorBy: filter.colorBy
        }
        isolateCategoryToggle(f)
      }
    }
  } else if (filterBy) {
    const filterByKey = Object.keys(filterBy || {})[0]
    const filterVal = filterBy[filterByKey]

    if (isNotFilter(filterVal)) {
      const values = filterVal.not
      for (const val of values) {
        const f = {
          filterKey: filterByKey,
          filterValue: val,
          allValues: [],
          colorBy: filter.colorBy
        }
        hideCategoryToggle(f)
      }
    }
  } else if (filter.colorBy) {
    toggleColorByCategory({ filterKey: filter.colorBy.property })
  }
}

export function resetFilter() {
  const viewer = getInitializedViewer()

  resetInternalHideIsolateObjectState()
  resetInternalCategoryObjectState()
  updateState({
    appliedFilter: null,
    preventCommentCollapse: true,
    currentFilterState: null
  })

  viewer.FilteringManager.reset()
  viewer.applyFilter(null)
}
