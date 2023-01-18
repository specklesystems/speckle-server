import {
  Viewer,
  DefaultViewerParams,
  FilteringState,
  PropertyInfo,
  ViewerEvent,
  SelectionEvent
} from '@speckle/viewer'
import { MaybeRef } from '@vueuse/shared'
import {
  inject,
  InjectionKey,
  ref,
  provide,
  ComputedRef,
  Ref,
  WritableComputedRef,
  Raw
} from 'vue'
import { useScopedState } from '~~/lib/common/composables/scopedState'
import { Nullable, SpeckleViewer } from '@speckle/shared'
import { useQuery } from '@vue/apollo-composable'
import {
  projectViewerResourcesQuery,
  viewerLoadedResourcesQuery
} from '~~/lib/viewer/graphql/queries'
import { useGetObjectUrl } from '~~/lib/viewer/helpers'
import { difference, uniq } from 'lodash-es'
import {
  ViewerLoadedResourcesQuery,
  ViewerResourceItem
} from '~~/lib/common/generated/gql/graphql'
import { SetNonNullable, Get } from 'type-fest'
import { useSelectionEvents } from '~~/lib/viewer/composables/viewer'

type LoadedModel = NonNullable<
  Get<ViewerLoadedResourcesQuery, 'project.models.items[0]'>
>

type LoadedCommentThread = NonNullable<
  Get<ViewerLoadedResourcesQuery, 'project.commentThreads.items[0]'>
>

type FilterAction = (
  objectIds: string[],
  stateKey: string,
  includeDescendants?: boolean
) => Promise<void>

export type InjectableViewerState = Readonly<{
  /**
   * The project which we're opening in the viewer (all loaded models should belong to it)
   */
  projectId: ComputedRef<string>
  /**
   * The actual Viewer instance and related objects.
   * Note: This is going to be undefined in SSR!
   */
  viewer: {
    /**
     * The actual viewer instance
     */
    instance: Viewer
    /**
     * Container onto which the Viewer instance is attached
     */
    container: HTMLElement
    /**
     * For checking when viewer.init() is complete
     */
    init: {
      promise: Promise<void>
      ref: ComputedRef<boolean>
    }
  }
  /**
   * Loaded/loadable resources
   */
  resources: {
    /**
     * State of resource identifiers that should be loaded (tied to the URL param)
     */
    request: {
      /**
       * All currently requested identifiers. You
       * can write to this to change which resources should be loaded.
       */
      items: WritableComputedRef<SpeckleViewer.ViewerRoute.ViewerResource[]>
      /**
       * Helper for switching model to a specific version (or just latest)
       */
      switchModelToVersion: (modelId: string, versionId?: string) => void
    }
    /**
     * State of resolved, validated & de-duplicated resources that are loaded in the viewer. These
     * are resolved from multiple GQL requests and update whenever resources.request updates.
     */
    response: {
      /**
       * Metadata about loaded items
       */
      resourceItems: ComputedRef<ViewerResourceItem[]>
      /**
       * Model GQL objects paired with their loaded version IDs
       */
      modelsAndVersionIds: ComputedRef<Array<{ model: LoadedModel; versionId: string }>>
      /**
       * Detached objects (not models/versions)
       */
      objects: ComputedRef<ViewerResourceItem[]>
      /**
       * Comment threads for all loaded resources
       */
      commentThreads: ComputedRef<Array<LoadedCommentThread>>
      /**
       * Project main metadata
       */
      project: ComputedRef<Get<ViewerLoadedResourcesQuery, 'project'>>
    }
  }
  /**
   * Interface state
   */
  ui: {
    /**
     * Read/write active viewer filters
     */
    filters: {
      current: ComputedRef<Nullable<FilteringState>>
      localFilterPropKey: ComputedRef<Nullable<string>>
      isolateObjects: FilterAction
      unIsolateObjects: FilterAction
      hideObjects: FilterAction
      showObjects: FilterAction
      setColorFilter: (property: PropertyInfo) => void
    }
    viewerBusy: WritableComputedRef<boolean>
    selection: {
      objects: Ref<Raw<Record<string, unknown>>[]>
      addToSelection: (object: Record<string, unknown>) => void
      removeFromSelection: (object: Record<string, unknown> | string) => void
      clearSelection: () => void
    }
  }
}>

type CachedViewerState = Pick<
  InjectableViewerState['viewer'],
  'container' | 'instance'
> & {
  initPromise: Promise<void>
}

type InitialSetupState = Pick<InjectableViewerState, 'projectId' | 'viewer'>

type InitialStateWithRequest = InitialSetupState & {
  resources: { request: InjectableViewerState['resources']['request'] }
}

type InitialStateWithRequestAndResponse = InitialSetupState &
  Pick<InjectableViewerState, 'resources'>

/**
 * Scoped state key for 'viewer' metadata, as we reuse it between routes
 */
const GlobalViewerDataKey = Symbol('GlobalViewerData')

/**
 * Vue injection key for the Injectable Viewer State
 */
const InjectableViewerStateKey: InjectionKey<InjectableViewerState> = Symbol(
  'INJECTABLE_VIEWER_STATE'
)

function createViewerData(): CachedViewerState {
  if (process.server)
    // we don't want to use nullable checks everywhere, so the nicer route here ends
    // up being telling TS to ignore the undefineds - you shouldn't use any of this in SSR anyway
    return undefined as unknown as CachedViewerState

  const container = document.createElement('div')
  container.id = 'renderer'
  container.style.display = 'block'
  container.style.width = '100%'
  container.style.height = '100%'

  const viewer = new Viewer(container, DefaultViewerParams)
  const initPromise = viewer.init()

  return {
    instance: viewer,
    container,
    initPromise
  }
}

/**
 * Setup actual viewer instance & related data
 */
function setupInitialState(params: UseSetupViewerParams): InitialSetupState {
  const projectId = computed(() => unref(params.projectId))

  const isInitialized = ref(false)
  const { instance, initPromise, container } = useScopedState(
    GlobalViewerDataKey,
    createViewerData
  ) || { initPromise: Promise.resolve() }
  initPromise.then(() => (isInitialized.value = true))

  return {
    projectId,
    viewer: process.server
      ? (undefined as unknown as InitialSetupState['viewer'])
      : {
          instance,
          container,
          init: {
            promise: initPromise,
            ref: computed(() => isInitialized.value)
          }
        }
  }
}

/**
 * Setup resource requests (tied to URL resource identifier param)
 */
function setupResourceRequest(state: InitialSetupState): InitialStateWithRequest {
  const route = useRoute()
  const router = useRouter()
  const getParam = computed(() => route.params.modelId as string)

  const resources = computed({
    get: () => SpeckleViewer.ViewerRoute.parseUrlParameters(getParam.value),
    set: (newResources) => {
      const modelId =
        SpeckleViewer.ViewerRoute.createGetParamFromResources(newResources)
      router.push({ params: { modelId } })
    }
  })

  const switchModelToVersion = (modelId: string, versionId?: string) => {
    const resourceArr = resources.value.slice()

    const resourceIdx = resourceArr.findIndex(
      (r) => SpeckleViewer.ViewerRoute.isModelResource(r) && r.modelId === modelId
    )

    if (resourceIdx !== -1) {
      // Replace
      const newResources = resources.value.slice()
      newResources.splice(
        resourceIdx,
        1,
        new SpeckleViewer.ViewerRoute.ViewerModelResource(modelId, versionId)
      )

      resources.value = newResources
    } else {
      // Add new one and allow de-duplication to do its thing
      resources.value = [
        new SpeckleViewer.ViewerRoute.ViewerModelResource(modelId, versionId),
        ...resources.value
      ]
    }
  }

  return {
    ...state,
    resources: {
      request: {
        items: resources,
        switchModelToVersion
      }
    }
  }
}

/**
 * Parse URL resource request and figure out the actual resource items we need to load in the viewer
 * through the GQL API
 */
function setupResponseResourceItems(
  state: InitialStateWithRequest
): InjectableViewerState['resources']['response']['resourceItems'] {
  const {
    projectId,
    resources: {
      request: { items: requestItems }
    }
  } = state

  const resourceString = computed(() =>
    SpeckleViewer.ViewerRoute.createGetParamFromResources(requestItems.value)
  )

  const { result: resolvedResourcesResult } = useQuery(
    projectViewerResourcesQuery,
    () => ({
      projectId: projectId.value,
      resourceUrlString: resourceString.value
    })
  )

  const resolvedResourceGroups = computed(
    () => resolvedResourcesResult.value?.project?.viewerResources || []
  )

  /**
   * Validated & de-duplicated resources that should be loaded in the viewer
   */
  const resourceItems = computed(() => {
    /**
     * Flatten results into an array of items that are properly ordered according to resource identifier priority.
     * Loading priority: Model w/ version > Model > Folder name > Object ID
     */
    const versionItems: ViewerResourceItem[] = []
    const modelItems: ViewerResourceItem[] = []
    const folderItems: ViewerResourceItem[] = []
    const objectItems: ViewerResourceItem[] = []
    for (const group of resolvedResourceGroups.value) {
      const [resource] = SpeckleViewer.ViewerRoute.parseUrlParameters(group.identifier)

      for (const item of group.items) {
        if (SpeckleViewer.ViewerRoute.isModelResource(resource)) {
          if (resource.versionId) {
            versionItems.push(item)
          } else {
            modelItems.push(item)
          }
        } else if (SpeckleViewer.ViewerRoute.isModelFolderResource(resource)) {
          folderItems.push(item)
        } else if (SpeckleViewer.ViewerRoute.isObjectResource(resource)) {
          objectItems.push(item)
        }
      }
    }

    const orderedItems = [
      ...versionItems,
      ...modelItems,
      ...folderItems,
      ...objectItems
    ]

    // Get rid of duplicates - only 1 resource per model & 1 resource per objectId
    const encounteredModels = new Set<string>()
    const encounteredObjects = new Set<string>()
    const finalItems: ViewerResourceItem[] = []
    for (const item of orderedItems) {
      const modelId = item.modelId
      const objectId = item.objectId

      if (modelId && encounteredModels.has(modelId)) continue
      if (encounteredObjects.has(objectId)) continue

      finalItems.push(item)
      if (modelId) encounteredModels.add(modelId)
      encounteredObjects.add(objectId)
    }

    return finalItems
  })

  return resourceItems
}

function setupResponseResourceData(
  state: InitialStateWithRequest,
  resourceItems: ReturnType<typeof setupResponseResourceItems>
): Omit<InjectableViewerState['resources']['response'], 'resourceItems'> {
  const {
    projectId,
    resources: {
      request: { items }
    }
  } = state

  const objects = computed(() =>
    resourceItems.value.filter((i) => !i.modelId && !i.versionId)
  )

  const nonObjectResourceItems = computed(() =>
    resourceItems.value.filter(
      (r): r is ViewerResourceItem & { modelId: string; versionId: string } =>
        !!r.modelId
    )
  )

  const { result: viewerLoadedResourcesResult } = useQuery(
    viewerLoadedResourcesQuery,
    () => ({
      projectId: projectId.value,
      modelIds: nonObjectResourceItems.value.map((r) => r.modelId),
      versionIds: nonObjectResourceItems.value.map((r) => r.versionId),
      resourceIdString: SpeckleViewer.ViewerRoute.createGetParamFromResources(
        items.value
      )
    })
  )

  const project = computed(() => viewerLoadedResourcesResult.value?.project)
  const models = computed(() => project.value?.models?.items || [])
  const commentThreads = computed(() => project.value?.commentThreads?.items || [])

  const modelsAndVersionIds = computed(() =>
    nonObjectResourceItems.value
      .map((r) => ({
        versionId: r.versionId,
        model: models.value.find((m) => m.id === r.modelId)
      }))
      .filter((o): o is SetNonNullable<typeof o, 'model'> => !!(o.versionId && o.model))
  )

  return {
    objects,
    commentThreads,
    modelsAndVersionIds,
    project
  }
}

/**
 * Load resource responses (all of the relevant data from server)
 */
function setupResourceResponse(
  state: InitialStateWithRequest
): InitialStateWithRequestAndResponse {
  const resourceItems = setupResponseResourceItems(state)
  const loadedResourceData = setupResponseResourceData(state, resourceItems)

  return {
    ...state,
    resources: {
      request: {
        ...state.resources.request
      },
      response: {
        resourceItems,
        ...loadedResourceData
      }
    }
  }
}

function setupInterfaceState(
  state: InitialStateWithRequestAndResponse
): InjectableViewerState {
  const { viewer } = state

  // Is viewer busy - Using writable computed so that we can always intercept these calls
  const isViewerBusy = ref(false)
  const viewerBusy = computed({
    get: () => isViewerBusy.value,
    set: (newVal) => (isViewerBusy.value = !!newVal)
  })

  // Filters
  const filteringState = ref(null as Nullable<FilteringState>)
  const localFilterPropKey = ref(null as Nullable<string>)

  const isolateObjects: FilterAction = async (...params) => {
    if (process.server) return
    viewerBusy.value = true

    const result = await viewer.instance.isolateObjects(...params)
    filteringState.value = result
    viewerBusy.value = false
  }

  const unIsolateObjects: FilterAction = async (...params) => {
    if (process.server) return
    viewerBusy.value = true

    const result = await viewer.instance.unIsolateObjects(...params)
    filteringState.value = result
    viewerBusy.value = false
  }

  const hideObjects: FilterAction = async (...params) => {
    if (process.server) return
    viewerBusy.value = true

    const result = await viewer.instance.hideObjects(...params)
    filteringState.value = result
    viewerBusy.value = false
  }

  const showObjects: FilterAction = async (...params) => {
    if (process.server) return
    viewerBusy.value = true

    const result = await viewer.instance.showObjects(...params)
    filteringState.value = result
    viewerBusy.value = false
  }

  const setColorFilter = async (property: PropertyInfo) => {
    if (process.server) return
    viewerBusy.value = true

    const result = await viewer.instance.setColorFilter(property)
    filteringState.value = result
    localFilterPropKey.value = property.key
    viewerBusy.value = false
  }

  const selectedObjects = ref<Raw<Record<string, unknown>>[]>([])

  const addToSelection = (object: Record<string, unknown>) => {
    const index = selectedObjects.value.findIndex((o) => o.id === object.id)
    if (index >= 0) return
    selectedObjects.value.push(markRaw(object))
  }

  const removeFromSelection = (object: Record<string, unknown> | string) => {
    const objectId = typeof object === 'string' ? object : (object.id as string)
    const index = selectedObjects.value.findIndex((o) => o.id === objectId)
    if (index > 0) selectedObjects.value.splice(index, 1)
  }

  const clearSelection = () => {
    selectedObjects.value = []
  }

  return {
    ...state,
    ui: {
      viewerBusy,
      filters: {
        current: computed(() => filteringState.value),
        localFilterPropKey: computed(() => localFilterPropKey.value),
        isolateObjects,
        unIsolateObjects,
        hideObjects,
        showObjects,
        setColorFilter
      },
      selection: {
        objects: selectedObjects,
        addToSelection,
        clearSelection,
        removeFromSelection
      }
    }
  }
}

/**
 * Automatically loads & unloads objects into the viewer depending on the global URL resource identifier state
 */
function useViewerObjectAutoLoading(state: InjectableViewerState) {
  if (process.server) return

  const getObjectUrl = useGetObjectUrl()
  const {
    projectId,
    viewer: {
      instance: viewer,
      init: { ref: isInitialized }
    },
    resources: {
      response: { resourceItems }
    }
  } = state

  const loadObject = (objectId: string, unload?: boolean) => {
    const objectUrl = getObjectUrl(projectId.value, objectId)
    if (unload) {
      viewer.unloadObject(objectUrl)
    } else {
      viewer.loadObject(objectUrl)
    }
  }

  const getUniqueObjectIds = (resourceItems: ViewerResourceItem[]) =>
    uniq(resourceItems.map((i) => i.objectId))

  watch(
    () => <const>[resourceItems.value, isInitialized.value],
    async ([newResources, newIsInitialized], oldData) => {
      // Wait till viewer loaded in
      if (!newIsInitialized) return

      const [oldResources, oldIsInitialized] = oldData || [[], false]

      // Viewer initialized - load in all resources
      if (newIsInitialized && !oldIsInitialized) {
        const allObjectIds = getUniqueObjectIds(newResources)
        await Promise.all(allObjectIds.map((i) => loadObject(i)))
        return
      }

      // Resources changed?
      const newObjectIds = getUniqueObjectIds(newResources)
      const oldObjectIds = getUniqueObjectIds(oldResources)
      const removableObjectIds = difference(oldObjectIds, newObjectIds)
      const addableObjectIds = difference(newObjectIds, oldObjectIds)

      await Promise.all(removableObjectIds.map((i) => loadObject(i, true)))
      await Promise.all(addableObjectIds.map((i) => loadObject(i)))
    },
    { deep: true, immediate: true }
  )

  onBeforeUnmount(async () => {
    await viewer.unloadAll()
  })
}

function useViewerSelectionEventHandler(state: InjectableViewerState) {
  useSelectionEvents(
    {
      singleClickCallback: (args: SelectionEvent) => {
        console.log('TODO: single click event')
        if (!args) return state.ui.selection.clearSelection()
        if (args.hits.length === 0) return state.ui.selection.clearSelection()
        if (!args.multiple) state.ui.selection.clearSelection()
        // TODO: check for first visible object
        state.ui.selection.addToSelection(
          args.hits[0].object as Record<string, unknown>
        )
      },
      doubleClickCallback: (args) => {
        console.log('double click event', args)
        if (!args) return state.viewer.instance.zoom()
        if (!args.hits) return state.viewer.instance.zoom()
        if (args.hits.length === 0) return state.viewer.instance.zoom()
        // TODO: check for first visible object
        const objectId = args.hits[0].object.id
        state.viewer.instance.zoom([objectId as string])
      }
    },
    { state }
  )
}

function useViewerIsBusyEventHandler(state: InjectableViewerState) {
  const callback = (isBusy: boolean) => {
    state.ui.viewerBusy.value = isBusy
  }
  onMounted(() => {
    state.viewer.instance.on(ViewerEvent.Busy, callback)
  })

  onBeforeUnmount(() => {
    state.viewer.instance.removeListener(ViewerEvent.Busy, callback)
  })
}

type UseSetupViewerParams = { projectId: MaybeRef<string> }

export function useSetupViewer(params: UseSetupViewerParams): InjectableViewerState {
  // Initialize full state object - each subsequent state initialization depends on
  // the results of the previous ones until we have the final full object
  const initState = setupInitialState(params)
  const initialStateWithRequest = setupResourceRequest(initState)
  const stateWithResources = setupResourceResponse(initialStateWithRequest)
  const state = setupInterfaceState(stateWithResources)

  // Inject it into descendant components
  provide(InjectableViewerStateKey, state)

  // Extra post-state-creation setup
  useViewerObjectAutoLoading(state)
  useViewerSelectionEventHandler(state) // TODO: needs implementation
  useViewerIsBusyEventHandler(state)

  return state
}

/**
 * COMPOSABLES FOR RETRIEVING (PARTS OF) INJECTABLE STATE
 */

export function useInjectedViewerState(): InjectableViewerState {
  // we're forcing TS to ignore the scenario where this data can't be found and returns undefined
  // to avoid unnecessary null checks everywhere
  const state = inject(InjectableViewerStateKey) as InjectableViewerState
  return state
}

export function useInjectedViewer(): InjectableViewerState['viewer'] {
  const { viewer } = useInjectedViewerState()
  return viewer
}

export function useInjectedViewerLoadedResources(): InjectableViewerState['resources']['response'] {
  const { resources } = useInjectedViewerState()
  return resources.response
}

export function useInjectedViewerRequestedResources(): InjectableViewerState['resources']['request'] {
  const { resources } = useInjectedViewerState()
  return resources.request
}

export function useInjectedViewerInterfaceState(): InjectableViewerState['ui'] {
  const { ui } = useInjectedViewerState()
  return ui
}
