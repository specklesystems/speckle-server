import { Viewer, DefaultViewerParams } from '@speckle/viewer'
import { inject, InjectionKey, Ref, ref, provide } from 'vue'
import { useScopedState } from '~~/lib/common/composables/scopedState'
import {
  createGetParamFromResources,
  isModelResource,
  parseUrlParameters,
  ViewerModelResource
} from '~~/lib/viewer/services/route'

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

  return { viewer, container, isInitialized, isInitializedPromise }
}

/**
 * Pass in a newly created Viewer instance and its container for injection down into child components
 * (through useInjectedViewer() or the injection keys manually).
 */
function setupNewViewerInjection(params: {
  viewer: Viewer
  container: HTMLElement
  initPromise: Promise<void>
}) {
  const viewer = params.viewer
  const container = params.container
  const isInitialized = ref(false)
  const isInitializedPromise = params.initPromise?.then(
    () => (isInitialized.value = true)
  )

  provide(ViewerKey, viewer)
  provide(ViewerContainerKey, container)
  provide(ViewerInitializedKey, isInitialized)
  provide(ViewerInitializedPromiseKey, isInitializedPromise)

  return { viewer, container, isInitialized, isInitializedPromise }
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
 * (Re-)initialize viewer
 * Note: All returned values will be undefined in SSR!
 */
export function setupViewer() {
  // re-use pre-initialized viewer data, if there's any
  const viewerData = useScopedState(GlobalViewerDataKey, createViewerData)

  const { viewer, container, isInitialized, isInitializedPromise } =
    setupNewViewerInjection({
      viewer: viewerData.viewer,
      container: viewerData.container,
      initPromise: viewerData.initialized
    })

  return { viewer, container, isInitialized, isInitializedPromise }
}

// TODO: Rename to useViewerResourcesState, maybe use local link state?
export function useViewerRouteResources() {
  const route = useRoute()
  const router = useRouter()
  const getParam = computed(() => route.params.modelId as string)

  const resources = computed({
    get: () => parseUrlParameters(getParam.value),
    set: (newResources) => {
      const modelId = createGetParamFromResources(newResources)
      router.push({ params: { modelId } })
    }
  })

  const switchModelToVersion = (modelId: string, versionId?: string) => {
    const resourceArr = resources.value.slice()

    const resourceIdx = resourceArr.findIndex(
      (r) => isModelResource(r) && r.modelId === modelId
    )
    if (resourceIdx === -1) return

    const newResource = resourceArr[resourceIdx] as ViewerModelResource
    newResource.versionId = versionId

    resources.value = resources.value.splice(resourceIdx, 1, newResource)
  }

  return { resources, switchModelToVersion }
}
