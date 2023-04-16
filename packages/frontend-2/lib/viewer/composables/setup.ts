/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {
  Viewer,
  DefaultViewerParams,
  FilteringState,
  PropertyInfo,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TreeNode,
  WorldTree
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
import { getTargetObjectIds } from '~~/lib/object-sidebar/helpers'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import {
  CommentBubbleModel,
  useViewerCommentBubbles
} from '~~/lib/viewer/composables/commentBubbles'
import { setupUrlHashState } from '~~/lib/viewer/composables/setup/urlHashState'
import { ShallowRef } from 'vue'

export type LoadedModel = NonNullable<
  Get<ViewerLoadedResourcesQuery, 'project.models.items[0]'>
>

export type LoadedThreadsMetadata = NonNullable<
  Get<ViewerLoadedThreadsQuery, 'project.commentThreads'>
>

export type LoadedCommentThread = NonNullable<Get<LoadedThreadsMetadata, 'items[0]'>>

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
     * Read/write active viewer filters
     */
    threads: {
      items: Ref<Record<string, CommentBubbleModel>>
      openThread: {
        thread: ComputedRef<CommentBubbleModel | undefined>
        isTyping: Ref<boolean>
        newThreadEditor: Ref<boolean>
      }
      closeAllThreads: () => void
      open: (id: string) => void
      hideBubbles: Ref<boolean>
    }
    spotlightUserId: Ref<Nullable<string>>
    worldTree: ShallowRef<WorldTree | undefined>
    filters: {
      all: ShallowRef<PropertyInfo[] | undefined>
      current: ComputedRef<Nullable<FilteringState>>
      userSelectedFilter: Ref<PropertyInfo | undefined>
      localFilterPropKey: ComputedRef<Nullable<string>>
      isolateObjects: FilterAction
      unIsolateObjects: FilterAction
      hideObjects: FilterAction
      showObjects: FilterAction
      resetFilters: () => Promise<void>
      setColorFilter: (property: PropertyInfo) => Promise<void>
      removeColorFilter: () => Promise<void>
    }
    camera: {
      isPerspectiveProjection: Ref<boolean>
      toggleProjection: () => void
      zoomExtentsOrSelection: () => void
    }
    sectionBox: {
      isSectionBoxEnabled: Ref<boolean>
      setSectionBox: (
        box?: {
          min: { x: number; y: number; z: number }
          max: { x: number; y: number; z: number }
        },
        offset?: number
      ) => void
      toggleSectionBox: () => void
      sectionBoxOff: () => void
      sectionBoxOn: () => void
    }
    viewerBusy: WritableComputedRef<boolean>
    selection: {
      objects: ComputedRef<Raw<Record<string, unknown>>[]>
      addToSelection: (object: Record<string, unknown>) => void
      setSelectionFromObjectIds: (ids: string[]) => void
      removeFromSelection: (object: Record<string, unknown> | string) => void
      clearSelection: () => void
    }
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

  // TODO: Do we maybe move isBusy toggles to the viewer side?
  const isolateObjects: FilterAction = async (...params) => {
    if (process.server) return

    const result = await viewer.instance.isolateObjects(...params, false)
    filteringState.value = markRaw(result)
  }

  const unIsolateObjects: FilterAction = async (...params) => {
    if (process.server) return

    const result = await viewer.instance.unIsolateObjects(...params)
    filteringState.value = markRaw(result)
  }

  const hideObjects: FilterAction = async (...params) => {
    if (process.server) return

    const result = await viewer.instance.hideObjects(...params)
    filteringState.value = markRaw(result)
  }

  const showObjects: FilterAction = async (...params) => {
    if (process.server) return

    const result = await viewer.instance.showObjects(...params)
    filteringState.value = markRaw(result)
  }

  const userSelectedFilter = ref<PropertyInfo | undefined>()

  const setColorFilter = async (property: PropertyInfo) => {
    if (process.server) return

    const result = await viewer.instance.setColorFilter(property)
    filteringState.value = markRaw(result)
    localFilterPropKey.value = property.key
  }

  const removeColorFilter = async () => {
    const result = await viewer.instance.removeColorFilter()
    filteringState.value = markRaw(result)
  }

  const resetFilters = async () => {
    await viewer.instance.resetFilters()
    viewer.instance.applyFilter(null)
    viewer.instance.resize() // Note: should not be needed in theory, but for some reason stuff doesn't re-render
    filteringState.value = null
    userSelectedFilter.value = undefined
  }

  const selectedObjects = ref<Raw<Record<string, unknown>>[]>([])

  const setViewerSelectionFilter = () => {
    const v = state.viewer.instance
    if (selectedObjects.value.length === 0) return v.resetSelection()
    let ids = [] as string[]
    for (const obj of selectedObjects.value) {
      const objIds = getTargetObjectIds(obj)
      ids.push(...objIds)
    }
    ids = [...new Set(ids.filter((id) => !!id))]

    v.selectObjects(ids)
  }

  const addToSelection = (object: Record<string, unknown>) => {
    const index = selectedObjects.value.findIndex((o) => o.id === object.id)
    if (index >= 0) return
    selectedObjects.value.unshift(markRaw(object))
    setViewerSelectionFilter()
  }

  // NOTE: can be used for directly selecting objects coming from user tracking.
  // commented out as not sure it's right behaviour.
  const setSelectionFromObjectIds = (ids: string[]) => {
    const tree = viewer.instance.getWorldTree()
    const res = tree.findAll((node: Record<string, unknown>) => {
      const t = node.model as Record<string, unknown>
      const raw = t.raw as Record<string, unknown>
      const id = raw.id as string
      if (!raw || !id) return false
      if (ids.includes(id)) return true
      return false
    })

    const objs = res.map(
      (node) => (node.model as Record<string, unknown>).raw as Record<string, unknown>
    ) // as Record<string, unknown>[] //.map((node) => node.model?.raw as Record<string, unknown>)
    selectedObjects.value = objs
    setViewerSelectionFilter()
  }

  const removeFromSelection = (object: Record<string, unknown> | string) => {
    const objectId = typeof object === 'string' ? object : (object.id as string)
    const index = selectedObjects.value.findIndex((o) => o.id === objectId)
    if (index >= 0) selectedObjects.value.splice(index, 1)
    setViewerSelectionFilter()
  }

  const clearSelection = () => {
    // Clear any vis/iso state
    // NOTE: turned off, as not sure it's the behaviour we want.
    // Worth keeping the code for future reference.
    // if (selectedObjects.value.length > 0) {
    //   let ids = [] as string[]
    //   for (const obj of selectedObjects.value) {
    //     const objIds = getTargetObjectIds(obj)
    //     ids.push(...objIds)
    //   }
    //   ids = [...new Set(ids.filter((id) => !!id))]
    //   // check if we actually have any isolated objects first from the selected object state
    //   if (
    //     filteringState.value?.isolatedObjects &&
    //     containsAll(ids, filteringState.value?.isolatedObjects as string[])
    //   )
    //     unIsolateObjects(ids, 'object-selection', true)

    //   // check if we actually have any isolated objects first from the hidden object state
    //   if (
    //     filteringState.value?.hiddenObjects &&
    //     containsAll(ids, filteringState.value?.hiddenObjects as string[])
    //   )
    //     showObjects(ids, 'object-selection', true)
    // }

    selectedObjects.value = []
    setViewerSelectionFilter()
  }

  const isPerspectiveProjection = ref(false)
  const toggleProjection = () => {
    state.viewer.instance.toggleCameraProjection()
    isPerspectiveProjection.value = !isPerspectiveProjection.value
  }

  const zoomExtentsOrSelection = () => {
    if (selectedObjects.value.length > 0) {
      return state.viewer.instance.zoom(
        selectedObjects.value.map((o) => o.id as string)
      )
    }

    if (
      filteringState.value?.isolatedObjects &&
      filteringState.value.isolatedObjects?.length > 0
    ) {
      return state.viewer.instance.zoom(filteringState.value.isolatedObjects)
    }
    state.viewer.instance.zoom()
  }

  const isSectionBoxEnabled = ref(false)
  const toggleSectionBox = () => {
    if (isSectionBoxEnabled.value) {
      isSectionBoxEnabled.value = false
      state.viewer.instance.toggleSectionBox()
      state.viewer.instance.requestRender()
      return
    }

    isSectionBoxEnabled.value = true
    const ids = selectedObjects.value.map((o) => o.id as string)
    if (ids.length > 0) state.viewer.instance.setSectionBoxFromObjects(ids)
    else state.viewer.instance.setSectionBox()

    state.viewer.instance.toggleSectionBox()
    state.viewer.instance.requestRender()
  }
  const setSectionBox = (
    box?: {
      min: { x: number; y: number; z: number }
      max: { x: number; y: number; z: number }
    },
    offset?: number
  ) => {
    state.viewer.instance.setSectionBox(box, offset)
  }

  const spotlightUserId = ref(null as Nullable<string>)

  /**
   * THREADS
   */
  const { commentThreads, openThread, closeAllThreads, open } = useViewerCommentBubbles(
    { state }
  )
  const isTyping = ref(false)
  const newThreadEditor = ref(false)

  const hideBubbles = ref(false)

  const worldTree = shallowRef()
  const allFilters = shallowRef()
  return {
    ...state,
    ui: {
      spotlightUserId,
      viewerBusy,
      worldTree,
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
        isPerspectiveProjection,
        toggleProjection,
        zoomExtentsOrSelection
      },
      sectionBox: {
        isSectionBoxEnabled,
        setSectionBox,
        toggleSectionBox,
        sectionBoxOff: () => {
          state.viewer.instance.sectionBoxOff()
          state.viewer.instance.requestRender() // TODO: seems render does not update on section box off
          isSectionBoxEnabled.value = false
        },
        sectionBoxOn: () => {
          state.viewer.instance.sectionBoxOn()
          isSectionBoxEnabled.value = true
        }
      },
      filters: {
        all: allFilters,
        current: computed(() => filteringState.value),
        localFilterPropKey: computed(() => localFilterPropKey.value),
        userSelectedFilter,
        isolateObjects,
        unIsolateObjects,
        hideObjects,
        showObjects,
        setColorFilter,
        removeColorFilter,
        resetFilters
      },
      selection: {
        objects: computed(() => selectedObjects.value.slice()),
        addToSelection,
        setSelectionFromObjectIds,
        clearSelection,
        removeFromSelection
      }
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
