import { Viewer, DefaultViewerParams } from '@speckle/viewer'
import { MaybeRef } from '@vueuse/shared'
import { inject, InjectionKey, Ref, ref, provide, ComputedRef } from 'vue'
import { useScopedState } from '~~/lib/common/composables/scopedState'
import { SpeckleViewer } from '@speckle/shared'
import { useQuery } from '@vue/apollo-composable'
import {
  projectViewerResourcesQuery,
  viewerLoadedResourcesQuery
} from '~~/lib/viewer/graphql/queries'
import { useGetObjectUrl } from '~~/lib/viewer/helpers'
import { difference, uniq } from 'lodash-es'
import { ViewerResourceItem } from '~~/lib/common/generated/gql/graphql'
import { SetNonNullable } from 'type-fest'

type MainSetupOptions = Partial<{
  /**
   * In some cases the data can't be injected (e.g. at the same level where it was provided), so it can
   * be fed in through props instead
   */
  viewerInjectionData: ViewerInjectionData
}>

const GlobalViewerDataKey = Symbol('GlobalViewerData')

// Keys you can use in the Viewer family of components to inject the viewer, its container and its init state
export const ViewerKey: InjectionKey<Viewer> = Symbol('VIEWER_INSTANCE')
export const ViewerInitializedKey: InjectionKey<Ref<boolean>> = Symbol(
  'VIEWER_INSTANCE_INITIALIZED'
)
export const ViewerInitializedPromiseKey: InjectionKey<Promise<boolean>> = Symbol(
  'VIEWER_INSTANCE_INITIALIZED_PROMISE'
)
export const ViewerContainerKey: InjectionKey<HTMLElement> = Symbol('VIEWER_CONTAINER')

const ViewerProjectIdKey: InjectionKey<ComputedRef<string>> =
  Symbol('VIEWER_PROJECT_ID')

const ViewerLoadedResourcesKey: InjectionKey<
  ReturnType<typeof useLoadedViewerResources>
> = Symbol('VIEWER_LOADED_RESOURCES')

/**
 * Inject viewer instance (it should be provided in an ancestor component using setupViewerInjection())
 */
export function useInjectedViewer() {
  // force casting, cause we know for a fact that these injections won't be undefined - handling the "or undefined" check everywhere
  // is going to be a pain in the ass
  const viewer = inject(ViewerKey) as Viewer
  const container = inject(ViewerContainerKey) as HTMLElement
  const isInitialized = inject(ViewerInitializedKey) as Ref<boolean>
  const isInitializedPromise = inject(ViewerInitializedPromiseKey) as Promise<boolean>
  const projectId = inject(ViewerProjectIdKey) as ComputedRef<string>

  return { viewer, container, isInitialized, isInitializedPromise, projectId }
}

type ViewerInjectionData = ReturnType<typeof useInjectedViewer>

/**
 * Pass in a newly created Viewer instance and its container for injection down into child components
 * (through useInjectedViewer() or the injection keys manually).
 */
function setupNewViewerInjection(params: {
  viewer: Viewer
  container: HTMLElement
  initPromise: Promise<void>
  projectId: ComputedRef<string>
}) {
  const viewer = params.viewer
  const container = params.container
  const isInitialized = ref(false)
  const isInitializedPromise = params.initPromise?.then(
    () => (isInitialized.value = true)
  )
  const projectId = params.projectId

  provide(ViewerKey, viewer)
  provide(ViewerContainerKey, container)
  provide(ViewerInitializedKey, isInitialized)
  provide(ViewerInitializedPromiseKey, isInitializedPromise)
  provide(ViewerProjectIdKey, projectId)

  return { viewer, container, isInitialized, isInitializedPromise, projectId }
}

type GlobalViewerData = {
  viewer: Viewer
  container: HTMLElement
  initialized: Promise<void>
}

function createViewerData(): GlobalViewerData {
  if (process.server)
    // we don't want to use nullable checks everywhere, so the nicer route here ends
    // up being telling TS to ignore the undefineds - you shouldn't use any of this in SSR anyway
    return {
      viewer: undefined,
      container: undefined,
      initialized: undefined
    } as unknown as GlobalViewerData

  const container = document.createElement('div')
  container.id = 'renderer'
  container.style.display = 'block'
  container.style.width = '100%'
  container.style.height = '100%'

  const viewer = new Viewer(container, DefaultViewerParams)
  const initPromise = viewer.init()

  return {
    viewer,
    container,
    initialized: initPromise
  }
}

/**
 * Use this to read/write currently loadable resources
 */
export function useViewerResourcesState() {
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

  return { resources, switchModelToVersion }
}

/**
 * Validated & resolved resources that are loaded in the viewer
 */
export function useResolvedViewerResources(options?: MainSetupOptions) {
  const { resources } = useViewerResourcesState()
  const { projectId } = options?.viewerInjectionData || useInjectedViewer()

  const resourceString = computed(() =>
    SpeckleViewer.ViewerRoute.createGetParamFromResources(resources.value)
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

  return { resourceItems, resourceString }
}

export function useLoadedViewerResources(options?: MainSetupOptions) {
  const { projectId } = options?.viewerInjectionData || useInjectedViewer()
  const { resourceItems, resourceString } = useResolvedViewerResources(options)

  /**
   * Resolved resource items that represent models & versions, not plain objects
   */
  const nonObjectResourceItems = computed(() =>
    resourceItems.value.filter(
      (r): r is ViewerResourceItem & { modelId: string; versionId: string } =>
        !!r.modelId
    )
  )

  /**
   * Resolved resource items that represent only plain objects, not models & versions
   */
  const objectResourceItems = computed(() =>
    resourceItems.value.filter((i) => !i.modelId && !i.versionId)
  )

  const { result: viewerLoadedResourcesResult } = useQuery(
    viewerLoadedResourcesQuery,
    () => ({
      projectId: projectId.value,
      modelIds: nonObjectResourceItems.value.map((r) => r.modelId),
      versionIds: nonObjectResourceItems.value.map((r) => r.versionId),
      resourceIdString: resourceString.value
    })
  )

  const models = computed(
    () => viewerLoadedResourcesResult.value?.project?.models?.items || []
  )
  const threads = computed(
    () => viewerLoadedResourcesResult.value?.project?.commentThreads?.items || []
  )

  /**
   * Pairs of (GQL) Models and their currently loaded in version IDs
   */
  const modelsAndVersionIds = computed(() =>
    nonObjectResourceItems.value
      .map((r) => ({
        versionId: r.versionId,
        model: models.value.find((m) => m.id === r.modelId)
      }))
      .filter((o): o is SetNonNullable<typeof o, 'model'> => !!(o.versionId && o.model))
  )

  return {
    resourceItems,
    nonObjectResourceItems,
    objectResourceItems,
    models,
    modelsAndVersionIds,
    threads,
    viewerLoadedResourcesResult
  }
}

/**
 * Provide loaded resource metadata & GQL results into child components for easy access
 */
function useProvideLoadedViewerResources(options?: MainSetupOptions) {
  const resources = useLoadedViewerResources(options)
  provide(ViewerLoadedResourcesKey, resources)
}

/**
 * Inject loaded resource metadata & GQL results into child components for easy access
 */
export function useInjectLoadedViewerResources() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return inject(ViewerLoadedResourcesKey)!
}

/**
 * Automatically loads & unloads objects into the viewer depending on the global URL resource identifier state
 */
function useViewerObjectAutoLoading(options?: MainSetupOptions) {
  const getObjectUrl = useGetObjectUrl()
  const viewerInjectionData = options?.viewerInjectionData || useInjectedViewer()
  const { resourceItems } = useResolvedViewerResources({ viewerInjectionData })

  const { projectId, viewer, isInitialized } = viewerInjectionData

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

/**
 * (Re-)initialize viewer
 * Note: All returned values will be undefined in SSR!
 */
export function useSetupViewer(params: {
  projectId: MaybeRef<string>
}): ViewerInjectionData {
  // re-use pre-initialized viewer data, if there's any
  const viewerData = useScopedState(GlobalViewerDataKey, createViewerData)

  const viewerInjectionData = setupNewViewerInjection({
    viewer: viewerData.viewer,
    container: viewerData.container,
    initPromise: viewerData.initialized,
    projectId: computed(() => unref(params.projectId))
  })

  // Set up automatic loading/unloading of Viewer objects
  useViewerObjectAutoLoading({ viewerInjectionData })

  // Provide loaded resource state into child components
  useProvideLoadedViewerResources({ viewerInjectionData })

  return viewerInjectionData
}

export function useViewerCameraTracker(callback: () => void): void {
  const { viewer } = useInjectedViewer()

  onMounted(() => {
    viewer.cameraHandler.controls.addEventListener('update', callback)
  })

  onBeforeUnmount(() => {
    viewer.cameraHandler.controls.removeEventListener('update', callback)
  })
}
