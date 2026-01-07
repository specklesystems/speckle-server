import {
  DefaultViewerParams,
  ViewerEvent,
  DefaultLightConfiguration,
  FilteringExtension,
  Viewer,
  SelectionExtension,
  MeasurementsExtension,
  SectionTool,
  SectionOutlines,
  HybridCameraController,
  ExplodeExtension,
  DiffExtension,
  ViewModes
} from '@speckle/viewer'
import type {
  ViewMode,
  FilteringState,
  SunLightConfiguration,
  SpeckleView,
  DiffResult,
  WorldTree,
  VisualDiffMode
} from '@speckle/viewer'
import { inject, ref, provide } from 'vue'
import type { ComputedRef, WritableComputedRef, Raw, Ref, ShallowRef } from 'vue'
import { useScopedState } from '~~/lib/common/composables/scopedState'
import type { MaybeNullOrUndefined, Nullable, Optional } from '@speckle/shared'
import { isNonNullable } from '@speckle/shared'
import { useApolloClient, useLazyQuery, useQuery } from '@vue/apollo-composable'
import {
  projectViewerResourcesQuery,
  viewerLoadedResourcesQuery,
  viewerLoadedThreadsQuery,
  viewerModelVersionsQuery
} from '~~/lib/viewer/graphql/queries'
import type {
  ProjectViewerResourcesQueryVariables,
  ViewerLoadedResourcesQuery,
  ViewerLoadedResourcesQueryVariables,
  ViewerLoadedThreadsQuery,
  ViewerResourceItem,
  ViewerLoadedThreadsQueryVariables,
  ProjectCommentsFilter,
  ViewerModelVersionCardItemFragment,
  UseViewerSavedViewSetup_SavedViewFragment,
  ProjectViewerResourcesQuery
} from '~~/lib/common/generated/gql/graphql'
import type { SetNonNullable, Get } from 'type-fest'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { nanoid } from 'nanoid'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import type { CommentBubbleModel } from '~~/lib/viewer/composables/commentBubbles'
import { setupUrlHashState } from '~~/lib/viewer/composables/setup/urlHashState'
import type {
  ModelsSubView,
  ActivePanel,
  SpeckleObject
} from '~/lib/viewer/helpers/sceneExplorer'
import { Vector3 } from 'three'
import { writableAsyncComputed } from '~~/lib/common/composables/async'
import type { AsyncWritableComputedRef } from '~~/lib/common/composables/async'
import { setupUiDiffState } from '~~/lib/viewer/composables/setup/diff'
import type { DiffStateCommand } from '~~/lib/viewer/composables/setup/diff'
import { useDiffUtilities, useMeasurementUtilities } from '~~/lib/viewer/composables/ui'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'
import { useCreateViewerFilteringDataStore } from '~/lib/viewer/composables/filtering/dataStore'
import { flatten, isUndefined, reduce } from 'lodash-es'
import { setupViewerCommentBubbles } from '~~/lib/viewer/composables/setup/comments'
import {
  InjectableViewerStateKey,
  useSetupViewerScope
} from '~/lib/viewer/composables/setup/core'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
import { buildManualPromise } from '@speckle/ui-components'
import { PassReader } from '../extensions/PassReader'
import type {
  MeasurementData,
  MeasurementOptions,
  SectionBoxData
} from '@speckle/shared/viewer/state'
import {
  createGetParamFromResources,
  isAllModelsResource,
  isModelFolderResource,
  isModelResource,
  isObjectResource,
  parseUrlParameters,
  resourceBuilder,
  ViewerModelResource,
  ViewerObjectResource,
  type ViewerResource
} from '@speckle/shared/viewer/route'
import type { SavedViewUrlSettings } from '~/lib/viewer/helpers/savedViews'
import type { FilterData } from '~/lib/viewer/helpers/filters/types'
import {
  useBuildSavedViewsCoreState,
  useBuildSavedViewsUIState,
  type SavedViewsUIState
} from '~/lib/viewer/composables/savedViews/state'
import type { defaultEdgeColorValue } from '~/lib/viewer/composables/setup/viewMode'
import { useViewModesSetup } from '~/lib/viewer/composables/setup/viewMode'
import { useMeasurementsSetup } from '~/lib/viewer/composables/setup/measurements'
import { useFiltersSetup } from '~/lib/viewer/composables/setup/filters'
import { useViewerPanelsSetup } from '~/lib/viewer/composables/setup/panels'
import { ViewerRenderPageType } from '~/lib/viewer/helpers/state'
import { HighlightExtension } from '~/lib/viewer/composables/setup/highlighting'

export type LoadedModel = NonNullable<
  Get<ViewerLoadedResourcesQuery, 'project.models.items[0]'>
>
export type LoadedThreadsMetadata = NonNullable<
  Get<ViewerLoadedThreadsQuery, 'project.commentThreads'>
>
export type LoadedCommentThread = NonNullable<Get<LoadedThreadsMetadata, 'items[0]'>>
type LoadedSavedView = UseViewerSavedViewSetup_SavedViewFragment
type LoadedExtendedResourceItems =
  | Get<ProjectViewerResourcesQuery, 'project.viewerResourcesExtended'>
  | null
  | undefined

export type InjectableViewerState = Readonly<{
  /**
   * The project which we're opening in the viewer (all loaded models should belong to it)
   */
  projectId: AsyncWritableComputedRef<string>
  /**
   * User viewer session ID. The same user will have different IDs in different tabs if multiple are open.
   * This is used to ignore user activity messages from the same tab.
   */
  sessionId: ComputedRef<string>
  /**
   * The type of page that this state is powering. Based on this, certain features/UIs
   * can be toggled.
   *
   * Default: Viewer (main viewer page), but can also be Presentation
   */
  pageType: ComputedRef<ViewerRenderPageType>
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
      /**
       * Based on a shallow ref
       */
      worldTree: ComputedRef<Optional<WorldTree>>
      views: ComputedRef<SpeckleView[]>
      filteringState: ComputedRef<Optional<FilteringState>>
      filteringDataStore: ReturnType<typeof useCreateViewerFilteringDataStore>
    }
    /**
     * Whether the Viewer has finished doing the initial object loading
     */
    hasDoneInitialLoad: Ref<boolean>
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
       * Saved view parameters, that affect what resources we're loading and how
       */
      savedView: {
        /**
         * The specific view to load.
         * Null - load NO saved view, not even implicit/home views
         * Undefined - load no specific view, but allow for implicit views (init value)
         * Specific ID - load this specific view
         *
         * Note: The implication here is that response.savedView can be loaded/set, even when
         * this value is falsy (undefined), because an implicit/home view was resolved
         */
        id: Ref<string | null | undefined>
        /**
         * By default we use latest or already loaded versions, but this allows
         * us to load the versions originally specified when creating the view
         */
        loadOriginal: Ref<boolean>
      }
      /**
       * All currently requested identifiers. You
       * can write to this to change which resources should be loaded.
       */
      items: AsyncWritableComputedRef<ViewerResource[]>
      /**
       * All currently requested identifiers in a comma-delimited string, the way it's
       * represented in the URL. Is writable also.
       */
      resourceIdString: AsyncWritableComputedRef<string>

      /**
       * Writable computed for reading/writing current thread filters
       */
      threadFilters: Ref<Omit<ProjectCommentsFilter, 'resourceIdString'>>

      /**
       * Helper for switching model to a specific version (or just latest)
       */
      switchModelToVersion: (modelId: string, versionId?: string) => Promise<void>
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
       * Actually loaded resource items but in string id format
       */
      resourceItemsIds: ComputedRef<string[]>
      /**
       * Variables used to load resource items identified by URL identifiers. Relevant when making cache updates
       */
      resourceItemsQueryVariables: ComputedRef<
        Optional<ProjectViewerResourcesQueryVariables>
      >
      resourceItemsExtended: ComputedRef<LoadedExtendedResourceItems>
      /**
       * Whether or not the initial resource items load has happened (useful in SSR)
       */
      resourceItemsLoaded: ComputedRef<boolean>
      /**
       * Whether or not the initial resources (models, objects etc.) have been loaded (useful in SSR)
       */
      resourcesLoaded: ComputedRef<boolean>
      /**
       * Model GQL objects paired with their loaded version IDs
       */
      modelsAndVersionIds: ComputedRef<Array<{ model: LoadedModel; versionId: string }>>
      /**
       * All available (retrieved from GQL) models and their versions
       */
      availableModelsAndVersions: ComputedRef<
        Array<{ model: LoadedModel; versions: LoadedModel['versions']['items'] }>
      >
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
      project: ComputedRef<Optional<Get<ViewerLoadedResourcesQuery, 'project'>>>
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
      resourcesLoading: ComputedRef<boolean>
      /**
       * Loaded saved view, if any
       */
      savedView: ComputedRef<Optional<LoadedSavedView>>
      /**
       * Whether we're in a federated view - loading multiple models/objects. We judge by the actual
       * resources being loaded not just the resourceIdString. The string could refer to multiple models,
       * but if none of them actually exist and are loaded then I wouldn't count that as a federated view.
       */
      isFederatedView: ComputedRef<boolean>
      /**
       * We don't want to save a comment or view w/ implicit identifiers like ones that only have a model ID or a folder prefix, because
       * those can resolve to completely different versions/objects as time goes on
       */
      concreteResourceIdString: ComputedRef<string>
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
      hideBubbles: Ref<boolean>
    }
    spotlightUserSessionId: Ref<Nullable<string>>
    filters: {
      isolatedObjectIds: Ref<string[]>
      hiddenObjectIds: Ref<string[]>
      selectedObjects: Ref<Raw<SpeckleObject>[]>
      /**
       * For quick object ID lookups
       */
      selectedObjectIds: ComputedRef<Set<string>>
      /**
       * Set of currently isolated object IDs for efficient lookups
       */
      isolatedObjectsSet: ComputedRef<Set<string> | null>

      // Multi-filter system
      propertyFilters: Ref<FilterData[]>
      filteredObjectsCount: Ref<number>
      hasAnyFiltersApplied: ComputedRef<boolean>
      activeColorFilterId: Ref<string | null>
    }
    camera: {
      position: Ref<Vector3>
      target: Ref<Vector3>
      isOrthoProjection: Ref<boolean>
    }
    viewMode: {
      mode: Ref<ViewMode>
      edgesEnabled: Ref<boolean>
      edgesWeight: Ref<number>
      outlineOpacity: Ref<number>
      edgesColor: Ref<typeof defaultEdgeColorValue | number>
      finalEdgesColor: ComputedRef<number>
      defaultEdgesColor: ComputedRef<number>
      resetViewMode: () => void
    }
    diff: {
      newVersion: ComputedRef<ViewerModelVersionCardItemFragment | undefined>
      oldVersion: ComputedRef<ViewerModelVersionCardItemFragment | undefined>
      time: Ref<number>
      mode: Ref<VisualDiffMode>
      result: ShallowRef<Optional<DiffResult>> //ComputedRef<Optional<DiffResult>>
      enabled: Ref<boolean>
    }
    sectionBox: Ref<Nullable<SectionBoxData>>
    sectionBoxContext: {
      visible: Ref<boolean>
      edited: Ref<boolean>
    }
    highlightedObjectIds: Ref<string[]>
    lightConfig: Ref<SunLightConfiguration>
    explodeFactor: Ref<number>
    loading: WritableComputedRef<boolean>
    loadProgress: Ref<number>
    /**
     * Similar to hasDoneInitialLoad, but also updated for following loads. Useful for tracking
     * if an entire set of models (e.g. federated view) has loaded.
     */
    hasLoadedQueuedUpModels: Ref<boolean>
    selection: Ref<Nullable<Vector3>>
    measurement: {
      enabled: Ref<boolean>
      options: Ref<MeasurementOptions>
      measurements: Ref<Array<MeasurementData>>
    }
    /**
     * Various saved views UI settings
     */
    savedViews: SavedViewsUIState
    /**
     * Opened viewer panel settings
     */
    panels: {
      active: Ref<ActivePanel>
      modelsSubView: Ref<ModelsSubView>
    }
  }
  /**
   * State stored in the anchor string of the URL
   */
  urlHashState: {
    focusedThreadId: AsyncWritableComputedRef<Nullable<string>>
    diff: AsyncWritableComputedRef<Nullable<DiffStateCommand>>
    /**
     * Core source of truth is under `resources.request.savedView`, but this allows
     * the saved view settings to be URL controlled
     */
    savedView: AsyncWritableComputedRef<Nullable<SavedViewUrlSettings>>
  }
}>

type CachedViewerState = Pick<
  InjectableViewerState['viewer'],
  'container' | 'instance'
> & {
  initPromise: Promise<void>
}

export type InitialSetupState = Pick<
  InjectableViewerState,
  'projectId' | 'viewer' | 'sessionId' | 'urlHashState' | 'pageType'
>

type InitialStateWithRequest = InitialSetupState & {
  resources: { request: InjectableViewerState['resources']['request'] }
}

export type InitialStateWithRequestAndResponse = InitialSetupState &
  Pick<InjectableViewerState, 'resources'>

export type InitialStateWithUrlHashState = InitialStateWithRequestAndResponse

export type InitialStateWithInterface = InitialStateWithUrlHashState &
  Pick<InjectableViewerState, 'ui'>

/**
 * Scoped state key for 'viewer' metadata, as we reuse it between routes
 */
const GlobalViewerDataKey = Symbol('GlobalViewerData')

function createViewerDataBuilder(params: { viewerDebug: boolean }) {
  return () => {
    if (import.meta.server)
      // we don't want to use nullable checks everywhere, so the nicer route here ends
      // up being telling TS to ignore the undefineds - you shouldn't use any of this in SSR anyway
      return undefined as unknown as CachedViewerState

    const container = document.createElement('div')
    container.id = 'renderer'
    container.style.display = 'block'
    container.style.width = '100%'
    container.style.height = '100%'

    const viewer = new Viewer(container, {
      ...DefaultViewerParams,
      verbose: !!(import.meta.client && params.viewerDebug)
    })
    viewer.createExtension(HybridCameraController)
    viewer.createExtension(SelectionExtension)
    viewer.createExtension(SectionTool)
    viewer.createExtension(SectionOutlines)
    viewer.createExtension(MeasurementsExtension)
    viewer.createExtension(FilteringExtension)
    viewer.createExtension(ExplodeExtension)
    viewer.createExtension(DiffExtension)
    viewer.createExtension(HighlightExtension)
    viewer.createExtension(ViewModes)
    viewer.createExtension(PassReader)

    /** Workaround so that the frontend comments get section outlines when comment that has sections needs to show at startup */
    viewer.on(ViewerEvent.LoadComplete, () => {
      const sections = viewer.getExtension(SectionTool)
      const sectionOutlines = viewer.getExtension(SectionOutlines)
      if (sections?.enabled && sectionOutlines) sectionOutlines.requestUpdate(true)
    })

    const initPromise = viewer.init()

    return {
      instance: viewer,
      container,
      initPromise
    }
  }
}

function setupViewerMetadata(params: {
  viewer: Viewer
}): InitialSetupState['viewer']['metadata'] {
  const { viewer } = params

  const worldTree = shallowRef(undefined as Optional<WorldTree>)
  const filteringState = shallowRef(undefined as Optional<FilteringState>)
  const views = ref([] as SpeckleView[])

  const filteringDataStore = useCreateViewerFilteringDataStore()

  const refreshWorldTreeAndFilters = async () => {
    worldTree.value = viewer.getWorldTree()
    views.value = viewer.getViews()
  }
  const updateFilteringState = (newState: MaybeNullOrUndefined<FilteringState>) => {
    // treating {}, null, undefined as the same, to avoid unnecessary updates
    filteringState.value =
      newState && Object.keys(newState).length > 0 ? newState : undefined
  }

  onMounted(() => {
    viewer.on(ViewerEvent.LoadComplete, refreshWorldTreeAndFilters)
    viewer
      .getExtension(FilteringExtension)
      .on(ViewerEvent.FilteringStateSet, updateFilteringState)
  })

  onBeforeUnmount(() => {
    viewer.removeListener(ViewerEvent.LoadComplete, refreshWorldTreeAndFilters)
    viewer
      .getExtension(FilteringExtension)
      .removeListener(ViewerEvent.FilteringStateSet, updateFilteringState)
  })

  return {
    worldTree: computed(() => worldTree.value),
    filteringState: computed(() => filteringState.value),
    views: computed(() => views.value),
    filteringDataStore
  }
}

/**
 * Setup actual viewer instance & related data
 */
function setupInitialState(params: UseSetupViewerParams): InitialSetupState {
  const {
    public: { viewerDebug }
  } = useRuntimeConfig()

  const route = useRoute()
  const sessionId = computed(() => nanoid())
  const isInitialized = ref(false)
  const { instance, initPromise, container } = useScopedState(
    GlobalViewerDataKey,
    createViewerDataBuilder({
      viewerDebug: viewerDebug || route.query.viewerVerbose === '1'
    })
  ) || { initPromise: Promise.resolve() }
  initPromise.then(() => (isInitialized.value = true))
  const hasDoneInitialLoad = ref(false)

  return {
    pageType: computed(() => params.pageType),
    projectId: params.projectId,
    sessionId,
    viewer: import.meta.server
      ? ({
          instance: undefined,
          container: undefined,
          init: {
            promise: new Promise(() => {}),
            ref: computed(() => false)
          },
          metadata: {
            worldTree: computed(() => undefined),
            views: computed(() => []),
            filteringState: computed(() => undefined)
          },
          hasDoneInitialLoad
        } as unknown as InitialSetupState['viewer'])
      : {
          instance,
          container,
          init: {
            promise: initPromise,
            ref: computed(() => isInitialized.value)
          },
          metadata: setupViewerMetadata({ viewer: instance }),
          hasDoneInitialLoad
        },
    urlHashState: setupUrlHashState()
  }
}

/**
 * Setup resource requests (tied to URL resource identifier param)
 */
function setupResourceRequest(
  state: InitialSetupState,
  params: UseSetupViewerParams
): InitialStateWithRequest {
  const resourceIdString = params.resourceIdString

  const resources = writableAsyncComputed({
    get: () => resourceBuilder().addResources(resourceIdString.value).toResources(),
    set: async (newResources) => {
      const newIdString = createGetParamFromResources(newResources)
      await resourceIdString.update(newIdString)
    },
    initialState: [],
    asyncRead: false
  })

  const discussionLoadedVersionOnly = useSynchronizedCookie<boolean>(
    'discussionLoadedVersionOnly',
    {
      default: () => true
    }
  )

  const threadFilters = ref({ loadedVersionsOnly: discussionLoadedVersionOnly.value })

  const switchModelToVersion = async (modelId: string, versionId?: string) => {
    const resourceArr = resources.value.slice()

    const resourceIdx = resourceArr.findIndex(
      (r) => isModelResource(r) && r.modelId === modelId
    )

    if (resourceIdx !== -1) {
      // Replace
      const newResources = resources.value.slice()
      newResources.splice(resourceIdx, 1, new ViewerModelResource(modelId, versionId))

      await resources.update(newResources)
    } else {
      // Add new one and allow de-duplication to do its thing
      await resources.update([
        new ViewerModelResource(modelId, versionId),
        ...resources.value
      ])
    }
  }

  watch(
    () => threadFilters.value.loadedVersionsOnly,
    (newVal, oldVal) => {
      if (newVal !== oldVal && newVal !== discussionLoadedVersionOnly.value) {
        discussionLoadedVersionOnly.value = newVal
      }
    }
  )

  return {
    ...state,
    resources: {
      request: {
        savedView: useBuildSavedViewsCoreState(state, params),
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
  | 'resourceItems'
  | 'resourceItemsQueryVariables'
  | 'resourceItemsLoaded'
  | 'savedView'
  | 'isFederatedView'
  | 'resourceItemsExtended'
  | 'resourceItemsIds'
  | 'concreteResourceIdString'
> {
  const globalError = useError()
  const {
    projectId,
    resources: {
      request: {
        resourceIdString,
        savedView: { id: savedViewId, loadOriginal }
      }
    },
    urlHashState: { savedView: urlHashSavedView }
  } = state

  const initLoadDone = ref(import.meta.server ? false : true)

  /**
   * Resolves actual resources to load:
   * - Viewer Resource Groups and items
   * - Saved View that was used, if any
   *
   * Both must be loaded together to avoid race conditions. They both change
   * what exactly ends up being loaded, so its important they're in sync.
   */
  const {
    result: resolvedResourcesResult,
    variables: resourceItemsQueryVariables,
    onError,
    onResult
  } = useQuery(
    projectViewerResourcesQuery,
    () => ({
      projectId: projectId.value,
      resourceUrlString: resourceIdString.value,
      ...(isUndefined(savedViewId.value)
        ? {
            // Omit entirely if undefined to allow for implicit/home views
          }
        : {
            // Load specific or load NONE
            savedViewId: savedViewId.value
          }),
      savedViewSettings: {
        loadOriginal: loadOriginal.value || false
      }
    }),
    { keepPreviousResult: true }
  )

  onError((err) => {
    globalError.value = createError({
      statusCode: 500,
      message: `Viewer resource resolution failed: ${err}`
    })
    initLoadDone.value = true
  })

  onResult(async (res) => {
    initLoadDone.value = true

    const data = res.data?.project?.viewerResourcesExtended
    if (!data) return

    // If saved view resolved, update resourceIdString from response
    // cause it may have changed
    const incomingResourceIdString = resourceBuilder().addResources(
      data.resourceIdString
    )
    const existing = resourceBuilder().addResources(resourceIdString.value)
    if (!incomingResourceIdString.isEqualTo(existing)) {
      await resourceIdString.update(incomingResourceIdString.toString())
    }

    // Check if savedViewId refered to an invalid one
    if (data.request?.savedViewId && data.request.savedViewId !== data.savedView?.id) {
      // switch to "no view"
      savedViewId.value = null
      void urlHashSavedView.update(null)
    }
  })

  const resourceItemsExtended = computed(
    () => resolvedResourcesResult.value?.project?.viewerResourcesExtended
  )

  const resolvedResourceGroups = computed(
    () => resourceItemsExtended.value?.groups || []
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
      const [resource] = parseUrlParameters(group.identifier)

      for (const item of group.items) {
        if (isModelResource(resource)) {
          if (resource.versionId) {
            versionItems.push(item)
          } else {
            modelItems.push(item)
          }
        } else if (isAllModelsResource(resource)) {
          allModelItems.push(item)
        } else if (isModelFolderResource(resource)) {
          folderItems.push(item)
        } else if (isObjectResource(resource)) {
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

    // Get rid of duplicates - only 1 resource per objectId
    const encounteredModels = new Set<string>()
    const encounteredObjects = new Set<string>()
    const finalItems: ViewerResourceItem[] = []
    for (const item of orderedItems) {
      const modelId = item.modelId
      const objectId = item.objectId

      // Uncommenting the following line resolved model duplication issues in the Model Panel
      // without affecting diffing functionality. If future diffing problems arise, revisit this.
      if (modelId && encounteredModels.has(modelId)) continue
      if (encounteredObjects.has(objectId)) continue

      finalItems.push(item)
      if (modelId) encounteredModels.add(modelId)
      encounteredObjects.add(objectId)
    }

    return finalItems
  })

  const resourceItemsIds = computed(() =>
    resourceItems.value.map((i) => {
      if (i.modelId) {
        return new ViewerModelResource(i.modelId, i.versionId || undefined).toString()
      } else {
        return new ViewerObjectResource(i.objectId).toString()
      }
    })
  )
  const resourceItemsLoaded = computed(() => initLoadDone.value)

  const savedView = computed(() => {
    const idToLoad = savedViewId.value
    const idLoaded =
      resolvedResourcesResult.value?.project?.viewerResourcesExtended.savedView?.id
    const savedViewFromRes =
      resolvedResourcesResult.value?.project?.viewerResourcesExtended.savedView ||
      undefined

    if (idToLoad && idToLoad !== idLoaded) return undefined // stale query
    if (!idToLoad && !idLoaded) return savedViewFromRes // could be home view

    return savedViewFromRes
  })

  const isFederatedView = computed(() => resourceItems.value.length > 1)
  const concreteResourceIdString = computed(() => {
    const builder = resourceBuilder()

    for (const resource of resourceItems.value) {
      if (resource.modelId && resource.versionId) {
        builder.addModel(resource.modelId, resource.versionId)
      } else {
        builder.addObject(resource.objectId)
      }
    }

    const finalString = builder.toString()
    return finalString || resourceIdString.value
  })

  return {
    resourceItemsExtended,
    resourceItemsIds,
    resourceItems,
    resourceItemsQueryVariables: computed(() => resourceItemsQueryVariables.value),
    resourceItemsLoaded,
    savedView,
    isFederatedView,
    concreteResourceIdString
  }
}

function setupResponseResourceData(
  state: InitialStateWithRequest,
  resourceItemsData: ReturnType<typeof setupResponseResourceItems>
): Pick<
  InjectableViewerState['resources']['response'],
  | 'objects'
  | 'commentThreads'
  | 'commentThreadsMetadata'
  | 'modelsAndVersionIds'
  | 'availableModelsAndVersions'
  | 'project'
  | 'resourceQueryVariables'
  | 'threadsQueryVariables'
  | 'loadMoreVersions'
  | 'resourcesLoaded'
  | 'resourcesLoading'
> {
  const apollo = useApolloClient().client
  const globalError = useError()
  const { triggerNotification } = useGlobalToast()
  const logger = useLogger()

  const {
    projectId,
    resources: {
      request: { resourceIdString, threadFilters }
    },
    urlHashState: { diff }
  } = state
  const { resourceItems, resourceItemsLoaded } = resourceItemsData

  const initLoadDone = ref(import.meta.server ? false : true)
  const objects = computed(() =>
    resourceItems.value.filter((i) => !i.modelId && !i.versionId)
  )

  const nonObjectResourceItems = computed(() =>
    resourceItems.value.filter(
      (r): r is ViewerResourceItem & { modelId: string; versionId: string } =>
        !!r.modelId
    )
  )

  const diffVersionIds = computed(() =>
    flatten(
      (diff.value?.diffs || []).map((d) => [d.versionA.versionId, d.versionB.versionId])
    )
  )

  // model.loadedVersion will be the actually currently loaded version +
  // any diff versions, if they're requested. the naming is confusing, but
  // model.loadedVersion = all currently loaded versions of that model, altho there's usually only 1
  const versionIds = computed(() =>
    [
      ...nonObjectResourceItems.value.map((r) => r.versionId),
      ...diffVersionIds.value
    ].sort()
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
    loading: viewerLoadedResourcesLoading,
    variables: viewerLoadedResourcesVariables,
    onError: onViewerLoadedResourcesError,
    onResult: onViewerLoadedResourcesResult,
    load: loadViewerLoadedResources
  } = useLazyQuery(viewerLoadedResourcesQuery, viewerLoadedResourcesVariablesFunc, {
    keepPreviousResult: true
  })

  const serverResourcesLoadedPromise = buildManualPromise<void>()
  if (import.meta.server) {
    watch(
      () => resourceItemsLoaded.value,
      async (newVal, oldVal) => {
        if (!newVal || oldVal) return

        // Load only now - once the previous query is done
        await loadViewerLoadedResources()
        serverResourcesLoadedPromise.resolve()
      },
      { flush: 'sync' }
    )
  } else {
    loadViewerLoadedResources()
    serverResourcesLoadedPromise.resolve()
  }

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

  const availableModelsAndVersions = computed(() => {
    const modelItems = models.value
    return reduce(
      modelItems,
      (res, entry) => {
        res.push({
          model: entry,
          versions: [...entry.loadedVersion.items, ...entry.versions.items]
        })
        return res
      },
      [] as Array<{
        model: (typeof modelItems)[0]
        versions: (typeof modelItems)[0]['versions']['items']
      }>
    )
  })

  onViewerLoadedResourcesError((err) => {
    // Show full page error only if serious error (core data couldn't be loaded)
    const isWorkingLoad = !!viewerLoadedResourcesResult.value?.project.models.items
    if (isWorkingLoad) {
      return
    }

    globalError.value = createError({
      statusCode: 500,
      message: `Viewer loaded resource resolution failed: ${err}`
    })
    initLoadDone.value = true
  })

  // Load initial batch of cursors for each model
  onViewerLoadedResourcesResult((res) => {
    initLoadDone.value = true
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
  } = useQuery(
    viewerLoadedThreadsQuery,
    () => ({
      projectId: projectId.value,
      filter: {
        ...threadFilters.value,
        resourceIdString: resourceIdString.value
      }
    }),
    () => ({
      keepPreviousResult: true,
      // Dont need threads when in presentation mode
      enabled: state.pageType.value !== ViewerRenderPageType.Presentation
    })
  )

  const commentThreadsMetadata = computed(
    () => viewerLoadedThreadsResult.value?.project?.commentThreads
  )
  const commentThreads = computed(() => commentThreadsMetadata.value?.items || [])

  onViewerLoadedThreadsError((err) => {
    // Show full page error only if serious error (core data couldn't be loaded)
    const isWorkingLoad =
      !!viewerLoadedThreadsResult.value?.project.commentThreads.items
    if (isWorkingLoad) {
      return
    }

    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Comment loading failed',
      description: `${err.message}`
    })
    logger.error(err)
  })

  onServerPrefetch(async () => {
    await Promise.all([serverResourcesLoadedPromise.promise])
  })

  return {
    objects,
    commentThreads,
    commentThreadsMetadata,
    modelsAndVersionIds,
    availableModelsAndVersions,
    project,
    resourceQueryVariables: computed(() => viewerLoadedResourcesVariables.value),
    threadsQueryVariables: computed(() => threadsQueryVariables.value),
    loadMoreVersions,
    resourcesLoaded: computed(() => initLoadDone.value),
    resourcesLoading: computed(() => viewerLoadedResourcesLoading.value)
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
  const isLoading = ref(false)
  const loading = computed({
    get: () => isLoading.value,
    set: (newVal) => (isLoading.value = !!newVal)
  })

  const loadProgress = ref(0)
  const hasLoadedQueuedUpModels = ref(false)

  const { filters } = useFiltersSetup()
  const { viewMode } = useViewModesSetup()

  const highlightedObjectIds = ref([] as string[])
  const spotlightUserSessionId = ref(null as Nullable<string>)

  const lightConfig = ref(DefaultLightConfiguration)
  const explodeFactor = ref(0)
  const selection = ref(null as Nullable<Vector3>)

  const selectedObjectIds = computed(
    () =>
      new Set(
        filters.selectedObjects.value
          .map((o: SpeckleObject) => o.id as MaybeNullOrUndefined<string>)
          .filter(isNonNullable)
      )
  )

  /**
   * THREADS
   */
  const { commentThreads, openThread, newThreadEditor } = setupViewerCommentBubbles({
    state
  })
  const isTyping = ref(false)
  const hideBubbles = ref(false)

  /**
   * Diffing
   */
  const diffState = setupUiDiffState(state)

  const position = ref(new Vector3())
  const target = ref(new Vector3())
  const isOrthoProjection = ref(false as boolean)

  return {
    ...state,
    ui: {
      viewMode,
      diff: {
        ...diffState
      },
      selection,
      lightConfig,
      explodeFactor,
      spotlightUserSessionId,
      loading,
      loadProgress,
      threads: {
        items: commentThreads,
        openThread: {
          thread: openThread,
          isTyping,
          newThreadEditor
        },
        hideBubbles
      },
      camera: {
        // position: wrapRefWithTracking(position, 'position'),
        // target: wrapRefWithTracking(target, 'target'),
        position,
        target,
        isOrthoProjection
      },
      sectionBox: ref(null as Nullable<SectionBoxData>),
      sectionBoxContext: {
        visible: ref(false),
        edited: ref(false)
      },
      filters: {
        ...filters,
        selectedObjectIds
      },
      highlightedObjectIds,
      measurement: useMeasurementsSetup(),
      savedViews: useBuildSavedViewsUIState(),
      panels: useViewerPanelsSetup(),
      hasLoadedQueuedUpModels
    }
  }
}

export type UseSetupViewerParams = {
  projectId: AsyncWritableComputedRef<string>
  resourceIdString: AsyncWritableComputedRef<string>
  pageType: ViewerRenderPageType
  /**
   * Optionally override savedView source of truth
   */
  savedView?: {
    id: InjectableViewerState['resources']['request']['savedView']['id']
    loadOriginal: InjectableViewerState['resources']['request']['savedView']['loadOriginal']
  }
}

export function useSetupViewer(params: UseSetupViewerParams): InjectableViewerState {
  // Initialize full state object - each subsequent state initialization depends on
  // the results of the previous ones until we have the final full object
  const initState = setupInitialState(params)
  const initialStateWithRequest = setupResourceRequest(initState, params)
  const stateWithResources = setupResourceResponse(initialStateWithRequest)
  const state: InjectableViewerState = setupInterfaceState(stateWithResources)

  // We don't want the state to ever be proxified (e.g. when passed through props),
  // cause that will break composables (refs will be automatically unwrapped as if
  // they're accessed in a template)
  const rawState = markRaw(state)

  // Inject it into descendant components
  provide(InjectableViewerStateKey, rawState)

  return rawState
}

// COMPOSABLES FOR RETRIEVING (PARTS OF) INJECTABLE STATE

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

export function useResetUiState() {
  const {
    ui: { camera, sectionBox, highlightedObjectIds, lightConfig, viewMode }
  } = useInjectedViewerState()
  const { resetFilters } = useFilterUtilities()
  const { endDiff } = useDiffUtilities()
  const { reset: resetMeasurements } = useMeasurementUtilities()

  return () => {
    camera.isOrthoProjection.value = false
    sectionBox.value = null
    highlightedObjectIds.value = []
    lightConfig.value = { ...DefaultLightConfiguration }
    viewMode.resetViewMode()
    resetFilters()
    resetMeasurements()
    endDiff()
  }
}

export { InjectableViewerStateKey, useSetupViewerScope }
