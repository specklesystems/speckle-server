import { inject, provide, ref, computed } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { SavedViewVisibility } from '~~/lib/common/generated/gql/graphql'
import type { InjectablePresentationState } from '~/lib/presentations/helpers/types'
import { usePresentationQuery } from '~/lib/presentations/graphql/queries'

const PresentationStateKey: InjectionKey<InjectablePresentationState> = Symbol(
  'INJECTABLE_PRESENTATION_STATE'
)

export function usePresentation(projectId: string, presentationId: string) {
  const { result } = useQuery(usePresentationQuery, () => ({
    projectId,
    savedViewGroupId: presentationId,
    savedViewGroupViewsInput: {
      onlyVisibility: SavedViewVisibility.Public
    }
  }))

  const currentSlideIndex = ref<number>(0)
  const hideUi = ref(false)

  const presentation = computed(() => result.value?.project.savedViewGroup || null)
  const workspace = computed(() => result.value?.project.workspace || null)
  const slides = computed(() => presentation.value?.views.items || [])
  const slideCount = computed(() => slides.value.length)
  const currentSlide = computed(() => slides.value[currentSlideIndex.value] || null)
  const isFirstSlide = computed(() => currentSlideIndex.value === 0)
  const isLastSlide = computed(() =>
    slides.value.length ? currentSlideIndex.value === slides.value.length - 1 : false
  )

  const state: InjectablePresentationState = {
    presentation,
    workspace,
    currentSlideIndex,
    hideUi,
    slides,
    currentSlide,
    isFirstSlide,
    isLastSlide,
    slideCount
  }

  provide(PresentationStateKey, state)

  return state
}

export function usePresentationState(): InjectablePresentationState {
  const state = inject(PresentationStateKey) as InjectablePresentationState
  return state
}

export function usePresentationActions() {
  const { currentSlideIndex, slides, hideUi, isFirstSlide, isLastSlide } =
    usePresentationState()

  const selectSlide = (slideId: string) => {
    const index = slides.value.findIndex((slide) => slide?.id === slideId)
    if (index !== -1) {
      currentSlideIndex.value = index
    }
  }

  const goToPrevious = () => {
    if (!isFirstSlide.value) {
      currentSlideIndex.value--
    }
  }

  const goToNext = () => {
    if (!isLastSlide.value) {
      currentSlideIndex.value++
    }
  }

  const toggleUi = () => {
    hideUi.value = !hideUi.value
  }

  return {
    selectSlide,
    goToPrevious,
    goToNext,
    toggleUi
  }
}
