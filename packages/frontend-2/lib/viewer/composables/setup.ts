/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {
  Viewer,
  DefaultViewerParams,
  FilteringState,
  PropertyInfo,
  WorldTree,
  ViewerEvent,
  SunLightConfiguration,
  DefaultLightConfiguration,
  SpeckleView
} from '@speckle/viewer'
import { MaybeRef } from '@vueuse/shared'
import {
  inject,
  InjectionKey,
  ref,
  provide,
  ComputedRef,
  WritableComputedRef,
  Raw,
  Ref
} from 'vue'
import { useScopedState } from '~~/lib/common/composables/scopedState'
import { Nullable, Optional, SpeckleViewer } from '@speckle/shared'
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import {
  projectViewerResourcesQuery,
  viewerLoadedResourcesQuery,
  viewerLoadedThreadsQuery,
  viewerModelVersionsQuery
} from '~~/lib/viewer/graphql/queries'
import {
  ProjectViewerResourcesQueryVariables,
  ViewerLoadedResourcesQuery,
  ViewerLoadedResourcesQueryVariables,
  ViewerLoadedThreadsQuery,
  ViewerResourceItem,
  ViewerLoadedThreadsQueryVariables,
  ProjectCommentsFilter
} from '~~/lib/common/generated/gql/graphql'
import { SetNonNullable, Get } from 'type-fest'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { nanoid } from 'nanoid'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import {
  CommentBubbleModel,
  useViewerCommentBubbles
} from '~~/lib/viewer/composables/commentBubbles'
import { setupUrlHashState } from '~~/lib/viewer/composables/setup/urlHashState'
import { SpeckleObject } from '~~/lib/common/helpers/sceneExplorer'
import { Box3, Vector3 } from 'three'

export type LoadedModel = NonNullable<
  Get<ViewerLoadedResourcesQuery, 'project.models.items[0]'>
>

export type LoadedThreadsMetadata = NonNullable<
  Get<ViewerLoadedThreadsQuery, 'project.commentThreads'>
>

export type LoadedCommentThread = NonNullable<Get<LoadedThreadsMetadata, 'items[0]'>>

// export type FilterAction = (
//   objectIds: string[],
//   stateKey: string,
//   includeDescendants?: boolean
// ) => Promise<void>

export type InjectableViewerState = Readonly<{
  /**
   * The project which we're opening in the viewer (all loaded models should belong to it)
   */
  projectId: ComputedRef<string>
  /**
   * User viewer session ID. The same user will have different IDs in different tabs if multiple are open.
   * This is used to ignore user activity messages from the same tab.
   */
  sessionId: ComputedRef<string>
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
    /**
     * Various values that represent the current Viewer instance state
     */
    metadata: {
      worldTree: ComputedRef<Optional<WorldTree>>
      availableFilters: ComputedRef<Optional<PropertyInfo[]>>
      views: ComputedRef<SpeckleView[]>
      filteringState: ComputedRef<Optional<FilteringState>>
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
       * All currently requested identifiers in a comma-delimited string, the way it's
       * represented in the URL. Is writable also.
       */
      resourceIdString: WritableComputedRef<string>

      /**
       * Writable computed for reading/writing current thread filters
       */
      threadFilters: Ref<Omit<ProjectCommentsFilter, 'resourceIdString'>>

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
       * Variables used to load resource items identified by URL identifiers. Relevant when making cache updates
       */
      resourceItemsQueryVariables: ComputedRef<
        Optional<ProjectViewerResourcesQueryVariables>
      >
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
       * Metadata about requested comment threads (e.g. total counts)
       */
      commentThreadsMetadata: ComputedRef<Optional<LoadedThreadsMetadata>>
      /**
       * Project main metadata
       */
      project: ComputedRef<Get<ViewerLoadedResourcesQuery, 'project'>>
      /**
       * Variables used to load the resource query. Relevant when making cache updates.
       */
      resourceQueryVariables: ComputedRef<Optional<ViewerLoadedResourcesQueryVariables>>
      /**
       * Variables used to load the threads query. Relevant when making cache updates.
       */
      threadsQueryVariables: ComputedRef<Optional<ViewerLoadedThreadsQueryVariables>>
      /**
       * Fetch the next page of versions for a loaded model
       */
      loadMoreVersions: (modelId: string) => Promise<void>
    }
  }
  /**
   * Interface state
   */
  ui: {
    /**
     * Thread and their bubble state
     */
    threads: {
      /**
       * Comment bubble models keyed by comment ID
       */
      items: Ref<Record<string, CommentBubbleModel>>
      openThread: {
        thread: ComputedRef<Optional<CommentBubbleModel>>
        isTyping: Ref<boolean>
        newThreadEditor: Ref<boolean>
      }
      closeAllThreads: () => void
      open: (id: string) => void
      hideBubbles: Ref<boolean>
    }
    spotlightUserId: Ref<Nullable<string>>
    filters: {
      isolatedObjectIds: Ref<string[]>
      hiddenObjectIds: Ref<string[]>
      selectedObjects: Ref<Raw<SpeckleObject>[]>
      propertyFilter: {
        filter: Ref<Nullable<PropertyInfo>>
        isApplied: Ref<boolean>
      }
      hasAnyFiltersApplied: ComputedRef<boolean>
    }
    camera: {
      position: Ref<Vector3>
      target: Ref<Vector3>
      isOrthoProjection: Ref<boolean>
    }
    sectionBox: Ref<Nullable<Box3>>
    highlightedObjectIds: Ref<string[]>
    lightConfig: Ref<SunLightConfiguration>
    explodeFactor: Ref<number>
    viewerBusy: WritableComputedRef<boolean>
    selection: Ref<Nullable<Vector3>>
  }
  /**
   * State stored in the anchor string of the URL
   */
  urlHashState: {
    focusedThreadId: WritableComputedRef<Nullable<string>>
  }
}>

type CachedViewerState = Pick<
  InjectableViewerState['viewer'],
  'container' | 'instance'
> & {
  initPromise: Promise<void>
}

type InitialSetupState = Pick<
  InjectableViewerState,
  'projectId' | 'viewer' | 'sessionId'
>

type InitialStateWithRequest = InitialSetupState & {
  resources: { request: InjectableViewerState['resources']['request'] }
}

export type InitialStateWithRequestAndResponse = InitialSetupState &
  Pick<InjectableViewerState, 'resources'>

export type InitialStateWithUrlHashState = InitialStateWithRequestAndResponse &
  Pick<InjectableViewerState, 'urlHashState'>

export type InitialStateWithInterface = InitialStateWithUrlHashState &
  Pick<InjectableViewerState, 'ui'>

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

function setupViewerMetadata(params: {
  viewer: Viewer
}): InitialSetupState['viewer']['metadata'] {
  const { viewer } = params

  const worldTree = shallowRef(undefined as Optional<WorldTree>)
  const availableFilters = shallowRef(undefined as Optional<PropertyInfo[]>)
  const filteringState = shallowRef(undefined as Optional<FilteringState>)
  const views = ref([] as SpeckleView[])

  const refreshWorldTreeAndFilters = (busy: boolean) => {
    if (busy) return
    worldTree.value = viewer.getWorldTree()
    availableFilters.value = viewer.getObjectProperties()
    views.value = viewer.getViews()
  }
  const updateFilteringState = (newState: FilteringState) => {
    filteringState.value = newState
  }

  onMounted(() => {
    viewer.on(ViewerEvent.Busy, refreshWorldTreeAndFilters)
    viewer.on(ViewerEvent.FilteringStateSet, updateFilteringState)
  })

  onBeforeUnmount(() => {
    viewer.removeListener(ViewerEvent.Busy, refreshWorldTreeAndFilters)
    viewer.removeListener(ViewerEvent.FilteringStateSet, updateFilteringState)
  })

  return {
    worldTree: computed(() => worldTree.value),
    availableFilters: computed(() => availableFilters.value),
    filteringState: computed(() => filteringState.value),
    views: computed(() => views.value)
  }
}

/**
 * Setup actual viewer instance & related data
 */
function setupInitialState(params: UseSetupViewerParams): InitialSetupState {
  const projectId = computed(() => unref(params.projectId))

  const sessionId = computed(() => nanoid())
  const isInitialized = ref(false)
  const { instance, initPromise, container } = useScopedState(
    GlobalViewerDataKey,
    createViewerData
  ) || { initPromise: Promise.resolve() }
  initPromise.then(() => (isInitialized.value = true))

  return {
    projectId,
    sessionId,
    viewer: process.server
      ? (undefined as unknown as InitialSetupState['viewer'])
      : {
          instance,
          container,
          init: {
            promise: initPromise,
            ref: computed(() => isInitialized.value)
          },
          metadata: setupViewerMetadata({ viewer: instance })
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
      router.push({ params: { modelId }, query: route.query, hash: route.hash })
    }
  })

  // we could use getParam, but `createGetParamFromResources` does sorting and de-duplication AFAIK
  const resourceIdString = computed({
    get: () => SpeckleViewer.ViewerRoute.createGetParamFromResources(resources.value),
    set: (newVal) => {
      const newResources = SpeckleViewer.ViewerRoute.parseUrlParameters(newVal)
      resources.value = newResources
    }
  })

  const threadFilters = ref({} as Omit<ProjectCommentsFilter, 'resourceIdString'>)

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
        resourceIdString,
        threadFilters,
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
): Pick<
  InjectableViewerState['resources']['response'],
  'resourceItems' | 'resourceItemsQueryVariables'
> {
  const globalError = useError()
  const {
    projectId,
    resources: {
      request: { resourceIdString }
    }
  } = state

  const {
    result: resolvedResourcesResult,
    variables: resourceItemsQueryVariables,
    onError
  } = useQuery(projectViewerResourcesQuery, () => ({
    projectId: projectId.value,
    resourceUrlString: resourceIdString.value
  }))

  onError((err) => {
    globalError.value = createError({
      statusCode: 500,
      message: `Viewer resource resolution failed: ${err}`
    })
  })

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
    const allModelItems: ViewerResourceItem[] = []
    for (const group of resolvedResourceGroups.value) {
      const [resource] = SpeckleViewer.ViewerRoute.parseUrlParameters(group.identifier)

      for (const item of group.items) {
        if (SpeckleViewer.ViewerRoute.isModelResource(resource)) {
          if (resource.versionId) {
            versionItems.push(item)
          } else {
            modelItems.push(item)
          }
        } else if (SpeckleViewer.ViewerRoute.isAllModelsResource(resource)) {
          allModelItems.push(item)
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
      ...allModelItems,
      ...objectItems
    ]

    // Get rid of duplicates - only 1 resource per model & 1 resource per objectId
    // TODO: @dim here you can remove the restriction to only have 1 model
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

  return {
    resourceItems,
    resourceItemsQueryVariables: computed(() => resourceItemsQueryVariables.value)
  }
}

function setupResponseResourceData(
  state: InitialStateWithRequest,
  resourceItemsData: ReturnType<typeof setupResponseResourceItems>
): Omit<
  InjectableViewerState['resources']['response'],
  'resourceItems' | 'resourceItemsQueryVariables'
> {
  const apollo = useApolloClient().client
  const globalError = useError()
  const { triggerNotification } = useGlobalToast()

  const {
    projectId,
    resources: {
      request: { resourceIdString, threadFilters }
    }
  } = state
  const { resourceItems } = resourceItemsData

  const objects = computed(() =>
    resourceItems.value.filter((i) => !i.modelId && !i.versionId)
  )

  const nonObjectResourceItems = computed(() =>
    resourceItems.value.filter(
      (r): r is ViewerResourceItem & { modelId: string; versionId: string } =>
        !!r.modelId
    )
  )
  const versionIds = computed(() =>
    nonObjectResourceItems.value.map((r) => r.versionId).sort()
  )
  const versionCursors = ref({} as Record<string, Nullable<string>>)

  const viewerLoadedResourcesVariablesFunc =
    (): ViewerLoadedResourcesQueryVariables => ({
      projectId: projectId.value,
      modelIds: nonObjectResourceItems.value.map((r) => r.modelId).sort(),
      versionIds: versionIds.value
    })

  // MODELS AND VERSIONS
  // sorting variables so that we don't refetech just because the order changed
  const {
    result: viewerLoadedResourcesResult,
    variables: viewerLoadedResourcesVariables,
    onError: onViewerLoadedResourcesError,
    onResult: onViewerLoadedResourcesResult
  } = useQuery(viewerLoadedResourcesQuery, viewerLoadedResourcesVariablesFunc)

  const project = computed(() => viewerLoadedResourcesResult.value?.project)
  const models = computed(() => project.value?.models?.items || [])

  const modelsAndVersionIds = computed(() =>
    nonObjectResourceItems.value
      .map((r) => ({
        versionId: r.versionId,
        model: models.value.find((m) => m.id === r.modelId)
      }))
      .filter((o): o is SetNonNullable<typeof o, 'model'> => !!(o.versionId && o.model))
  )

  onViewerLoadedResourcesError((err) => {
    globalError.value = createError({
      statusCode: 500,
      message: `Viewer loaded resource resolution failed: ${err}`
    })
  })

  // Load initial batch of cursors for each model
  onViewerLoadedResourcesResult((res) => {
    if (!res.data?.project?.models) return

    for (const model of res.data.project.models.items) {
      const modelId = model.id
      if (versionCursors.value[modelId]) continue

      const cursor = model.versions.cursor
      if (!cursor) continue

      versionCursors.value[modelId] = cursor
    }
  })

  const loadMoreVersions = async (modelId: string) => {
    const cursor = versionCursors.value[modelId]
    const baseVariables = viewerLoadedResourcesVariablesFunc()
    const { data, errors } = await apollo
      .query({
        query: viewerModelVersionsQuery,
        variables: {
          projectId: baseVariables.projectId,
          modelId,
          versionsCursor: cursor
        },
        fetchPolicy: 'network-only'
      })
      .catch(convertThrowIntoFetchResult)

    if (!data?.project?.model?.versions) {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: "Can't load more versions",
        description: getFirstErrorMessage(errors)
      })
      return
    }

    if (data.project.model.versions.cursor) {
      versionCursors.value[modelId] = data.project.model.versions.cursor
    }
  }

  // COMMENT THREADS
  const {
    result: viewerLoadedThreadsResult,
    onError: onViewerLoadedThreadsError,
    variables: threadsQueryVariables
  } = useQuery(viewerLoadedThreadsQuery, () => ({
    projectId: projectId.value,
    filter: {
      ...threadFilters.value,
      resourceIdString: resourceIdString.value
    }
  }))

  const commentThreadsMetadata = computed(
    () => viewerLoadedThreadsResult.value?.project?.commentThreads
  )
  const commentThreads = computed(() => commentThreadsMetadata.value?.items || [])

  onViewerLoadedThreadsError((err) => {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Comment loading failed',
      description: `${err.message}`
    })
    console.error(err)
  })

  return {
    objects,
    commentThreads,
    commentThreadsMetadata,
    modelsAndVersionIds,
    project,
    resourceQueryVariables: computed(() => viewerLoadedResourcesVariables.value),
    threadsQueryVariables: computed(() => threadsQueryVariables.value),
    loadMoreVersions
  }
}

/**
 * Load resource responses (all of the relevant data from server)
 */
function setupResourceResponse(
  state: InitialStateWithRequest
): InitialStateWithRequestAndResponse {
  const resourceItemsData = setupResponseResourceItems(state)
  const loadedResourceData = setupResponseResourceData(state, resourceItemsData)

  return {
    ...state,
    resources: {
      request: {
        ...state.resources.request
      },
      response: {
        ...resourceItemsData,
        ...loadedResourceData
      }
    }
  }
}

function setupInterfaceState(
  state: InitialStateWithUrlHashState
): InitialStateWithInterface {
  // Is viewer busy - Using writable computed so that we can always intercept these calls
  const isViewerBusy = ref(false)
  const viewerBusy = computed({
    get: () => isViewerBusy.value,
    set: (newVal) => (isViewerBusy.value = !!newVal)
  })

  const isolatedObjectIds = ref([] as string[])
  const hiddenObjectIds = ref([] as string[])
  const selectedObjects = shallowRef<Raw<SpeckleObject>[]>([])
  const propertyFilter = ref(null as Nullable<PropertyInfo>)
  const isPropertyFilterApplied = ref(false)
  const hasAnyFiltersApplied = computed(() => {
    if (isolatedObjectIds.value.length) return true
    if (hiddenObjectIds.value.length) return true
    if (propertyFilter.value && isPropertyFilterApplied.value) return true
    if (explodeFactor.value !== 0 ) return true
    return false
  })

  const highlightedObjectIds = ref([] as string[])
  const spotlightUserId = ref(null as Nullable<string>)

  const lightConfig = ref(DefaultLightConfiguration)
  const explodeFactor = ref(0)
  const selection = ref(null as Nullable<Vector3>)

  /**
   * THREADS
   */
  const { commentThreads, openThread, closeAllThreads, open } = useViewerCommentBubbles(
    { state }
  )
  const isTyping = ref(false)
  const newThreadEditor = ref(false)
  const hideBubbles = ref(false)

  return {
    ...state,
    ui: {
      selection,
      lightConfig,
      explodeFactor,
      spotlightUserId,
      viewerBusy,
      threads: {
        items: commentThreads,
        openThread: {
          thread: openThread,
          isTyping,
          newThreadEditor
        },
        closeAllThreads,
        open,
        hideBubbles
      },
      camera: {
        position: ref(new Vector3()),
        target: ref(new Vector3()),
        isOrthoProjection: ref(false as boolean)
      },
      sectionBox: ref(null as Nullable<Box3>),
      filters: {
        isolatedObjectIds,
        hiddenObjectIds,
        selectedObjects,
        propertyFilter: {
          filter: propertyFilter,
          isApplied: isPropertyFilterApplied
        },
        hasAnyFiltersApplied
      },
      highlightedObjectIds
    }
  }
}

type UseSetupViewerParams = { projectId: MaybeRef<string> }

export function useSetupViewer(params: UseSetupViewerParams): InjectableViewerState {
  // Initialize full state object - each subsequent state initialization depends on
  // the results of the previous ones until we have the final full object
  const initState = setupInitialState(params)
  const initialStateWithRequest = setupResourceRequest(initState)
  const stateWithResources = setupResourceResponse(initialStateWithRequest)
  const stateWithUrlHashState: InitialStateWithUrlHashState = {
    ...stateWithResources,
    urlHashState: setupUrlHashState()
  }
  const state: InjectableViewerState = setupInterfaceState(stateWithUrlHashState)

  // Inject it into descendant components
  provide(InjectableViewerStateKey, state)

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

/**
 * Use this when you want to use the viewer state outside the viewer, ie in a component that's inside a portal!
 * @param state
 */
export function useSetupViewerScope(
  state: InjectableViewerState
): InjectableViewerState {
  provide(InjectableViewerStateKey, state)
  return state
}
