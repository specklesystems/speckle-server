import type { Optional } from '@speckle/shared'
import { resourceBuilder } from '@speckle/shared/viewer/route'
import type { AsyncWritableComputedRef } from '@speckle/ui-components'
import { useQuery } from '@vue/apollo-composable'
import type { Get } from 'type-fest'
import {
  type ProjectPresentationPageQuery,
  SavedViewVisibility
} from '~/lib/common/generated/gql/graphql'
import { projectPresentationPageQuery } from '~/lib/presentations/graphql/queries'
import { useProjectSavedViewsUpdateTracking } from '~/lib/viewer/composables/savedViews/subscriptions'

type ResponseProject = Optional<Get<ProjectPresentationPageQuery, 'project'>>
type ResponseWorkspace = Get<ProjectPresentationPageQuery, 'project.limitedWorkspace'>
type ResponseGroup = Get<ResponseProject, 'savedViewGroup'>
type ResponseView = NonNullable<Get<ResponseGroup, 'views.items.0'>>

export type InjectablePresentationState = Readonly<{
  projectId: AsyncWritableComputedRef<string>
  presentationId: AsyncWritableComputedRef<string>
  response: {
    project: ComputedRef<ResponseProject>
    workspace: ComputedRef<ResponseWorkspace>
    presentation: ComputedRef<ResponseGroup>
    slides: ComputedRef<ResponseView[]>
    /**
     * In case we want to fetch private slides again later, only return public slides
     */
    visibleSlides: ComputedRef<ResponseView[]>
  }
  ui: {
    /**
     * Current slide to show (0 based indexing)
     */
    slideIdx: Ref<number>
    slide: ComputedRef<ResponseView | undefined>
    slideCount: ComputedRef<number>
  }
  viewer: {
    /**
     * The actual resource id string to load in the viewer - built from presentation metadata,
     * active slide etc.
     */
    resourceIdString: ComputedRef<string>
    /**
     * Whether the current view has been changed from the saved view state
     */
    hasViewChanged: Ref<boolean>
  }
}>

type InitState = Pick<InjectablePresentationState, 'projectId' | 'presentationId'>
type ResponseState = Pick<InjectablePresentationState, 'response'>
type UiState = Pick<InjectablePresentationState, 'ui'>
type ViewerState = Pick<InjectablePresentationState, 'viewer'>

export const InjectablePresentationStateKey: InjectionKey<InjectablePresentationState> =
  Symbol('INJECTABLE_PRESENTATION_STATE')

export type UseSetupPresentationParams = {
  projectId: AsyncWritableComputedRef<string>
  presentationId: AsyncWritableComputedRef<string>
}

const setupStateResponse = (initState: InitState): ResponseState => {
  const { result } = useQuery(projectPresentationPageQuery, () => ({
    projectId: initState.projectId.value,
    savedViewGroupId: initState.presentationId.value,
    input: {
      limit: 100,
      onlyVisibility: SavedViewVisibility.Public
    }
  }))

  const project = computed(() => result.value?.project)
  const presentation = computed(() => project.value?.savedViewGroup)
  const workspace = computed(() => project.value?.limitedWorkspace)
  const slides = computed(() => presentation.value?.views.items || [])
  const visibleSlides = computed(() => slides.value)

  return {
    response: {
      project,
      workspace,
      presentation,
      slides,
      visibleSlides
    }
  }
}

const setupStateViewer = (initState: ResponseState & UiState): ViewerState => {
  const {
    response: { presentation },
    ui: { slideIdx }
  } = initState

  const hasViewChanged = ref(false)

  const resourceIdString = computed(() => {
    const slides = presentation.value?.views.items || []

    return resourceBuilder()
      .addResources(slides.at(slideIdx.value)?.resourceIdString || '')
      .toString()
  })

  return {
    viewer: {
      resourceIdString,
      hasViewChanged
    }
  }
}

const setupStateUi = (initState: ResponseState): UiState => {
  const slideIdx = ref(0)

  const slide = computed(() => {
    const slides = initState.response.slides.value
    return slides.at(slideIdx.value)
  })

  const slideCount = computed(() => {
    const slides = initState.response.slides.value
    return slides.length
  })

  return {
    ui: {
      slideIdx,
      slide,
      slideCount
    }
  }
}

export const useSetupPresentationState = (params: UseSetupPresentationParams) => {
  const initState: InitState = params
  const responseState = setupStateResponse(initState)
  const uiState = setupStateUi(responseState)
  const viewerState = setupStateViewer({ ...responseState, ...uiState })

  const state: InjectablePresentationState = {
    ...initState,
    ...responseState,
    ...uiState,
    ...viewerState
  }

  useProjectSavedViewsUpdateTracking({ projectId: initState.projectId })

  // We don't want the state to ever be proxified (e.g. when passed through props),
  // cause that will break composables (refs will be automatically unwrapped as if
  // they're accessed in a template)
  const rawState = markRaw(state)

  provide(InjectablePresentationStateKey, rawState)
  return rawState
}

export const useInjectedPresentationState = (): InjectablePresentationState => {
  // we're forcing TS to ignore the scenario where this data can't be found and returns undefined
  // to avoid unnecessary null checks everywhere
  const state = inject(InjectablePresentationStateKey) as InjectablePresentationState
  return state
}
