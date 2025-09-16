<template>
  <div class="relative">
    <div class="h-screen w-screen flex flex-col md:flex-row relative">
      <PresentationCloseMessage
        class="absolute z-50 top-4 left-1/2 -translate-x-1/2"
        :show-close-message="showCloseMessage"
        @hide-close-message="hideCloseMessage"
      />

      <PresentationHeader
        v-if="!hideUi"
        v-model:is-sidebar-open="isLeftSidebarOpen"
        class="absolute top-4 z-40"
        :class="[
          isLeftSidebarOpen ? 'left-[calc(50%+0.75rem)] md:left-[15.75rem]' : 'left-4'
        ]"
        :title="presentation?.title"
        @toggle-sidebar="isLeftSidebarOpen = !isLeftSidebarOpen"
      />

      <PresentationActions
        v-if="!hideUi"
        v-model:is-sidebar-open="isInfoSidebarOpen"
        v-model:is-present-mode="isPresentMode"
        :presentation-id="presentation?.id"
        class="absolute top-4 right-4 z-20"
        :class="{ 'lg:right-[21rem]': isInfoSidebarOpen }"
        @toggle-sidebar="isInfoSidebarOpen = !isInfoSidebarOpen"
        @toggle-present-mode="isPresentMode = !isPresentMode"
      />

      <PresentationSlideIndicator
        class="absolute top-1/2 -translate-y-1/2 z-20"
        :current-slide-index="currentVisibleIndex"
        :slide-count="slideCount || 0"
        :class="[isLeftSidebarOpen ? 'lg:left-[15.75rem] hidden md:block' : 'left-4']"
      />

      <PresentationLeftSidebar
        v-if="isLeftSidebarOpen"
        class="absolute left-0 top-0 md:relative flex-shrink-0 z-30"
        :slides="presentation"
        :workspace-logo="workspace?.logo"
        :workspace-name="workspace?.name"
        :current-slide-id="currentViewId"
        :is-present-mode="isPresentMode"
        @select-slide="onSelectSlide"
      />

      <div class="flex-1">
        <Component
          :is="group ? ViewerWrapper : 'div'"
          :group="group"
          class="h-full w-full object-cover"
        />
      </div>

      <PresentationInfoSidebar
        v-if="isInfoSidebarOpen"
        class="flex-shrink-0"
        :title="currentView?.name"
        :description="currentView?.description"
        :view-id="currentView?.id"
        :project-id="projectId"
        :is-present-mode="isPresentMode"
      />

      <PresentationControls
        v-if="!hideUi"
        class="absolute left-1/2 -translate-x-1/2"
        :disable-previous="disablePrevious"
        :disable-next="disableNext"
        :class="[
          isInfoSidebarOpen ? 'bottom-52 md:bottom-4' : 'bottom-4',
          isLeftSidebarOpen ? 'hidden md:flex' : ''
        ]"
        @on-previous="onPrevious"
        @on-next="onNext"
      />

      <PresentationSpeckleLogo
        class="absolute right-4 z-20"
        :class="[isInfoSidebarOpen ? 'bottom-52 md:bottom-4' : 'bottom-4']"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'
import { SavedViewVisibility } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectPresentations_SavedViewGroup on SavedViewGroup {
    id
  }
`)

const projectPresentationPageQuery = graphql(`
  query ProjectPresentationPage(
    $input: SavedViewGroupViewsInput!
    $savedViewGroupId: ID!
    $projectId: String!
  ) {
    project(id: $projectId) {
      id
      workspace {
        id
        name
        logo
      }
      savedViewGroup(id: $savedViewGroupId) {
        id
        title
        ...PresentationSlidesSidebar_SavedViewGroup
        ...PresentationViewerWrapper_SavedViewGroup
        views(input: $input) {
          totalCount
          items {
            id
            name
            description
            screenshot
            projectId
            visibility
            group {
              id
            }
          }
        }
      }
    }
  }
`)

definePageMeta({
  layout: 'empty'
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const savedViewGroupId = computed(() => route.params.presentationId as string)
const { result } = useQuery(projectPresentationPageQuery, () => ({
  projectId: projectId.value,
  savedViewGroupId: savedViewGroupId.value,
  input: {
    limit: 100
  }
}))

const currentViewId = ref<string | undefined>()
const isInfoSidebarOpen = ref(true)
const isLeftSidebarOpen = ref(true)
const hideUi = ref(false)
const isPresentMode = ref(false)
const showCloseMessage = ref(false)
const closeMessageTimeout = ref<NodeJS.Timeout | undefined>()

const ViewerWrapper = resolveComponent('PresentationViewerWrapper')
const group = computed(() => result.value?.project.savedViewGroup)
const workspace = computed(() => result.value?.project.workspace)
const allSlides = computed(() => result.value?.project.savedViewGroup.views.items || [])
const visibleSlides = computed(() =>
  allSlides.value.filter((view) => view.visibility === SavedViewVisibility.Public)
)
const currentView = computed(() =>
  allSlides.value.find((slide) => slide.id === currentViewId.value)
)
const slideCount = computed(() => visibleSlides.value?.length || 0)
const presentation = computed(() => result.value?.project.savedViewGroup)
const currentVisibleIndex = computed(() => {
  if (!currentViewId.value) return 0
  return visibleSlides.value.findIndex((slide) => slide.id === currentViewId.value)
})
const disablePrevious = computed(() => currentVisibleIndex.value === 0)
const disableNext = computed(() =>
  slideCount.value ? currentVisibleIndex.value === slideCount.value - 1 : false
)

const onSelectSlide = (slideId: string) => {
  currentViewId.value = slideId
}

const onPrevious = () => {
  const currentIndex = currentVisibleIndex.value
  if (currentIndex > 0) {
    const previousSlide = visibleSlides.value[currentIndex - 1]
    currentViewId.value = previousSlide.id
  }
}

const onNext = () => {
  const currentIndex = currentVisibleIndex.value
  if (currentIndex < visibleSlides.value.length - 1) {
    const nextSlide = visibleSlides.value[currentIndex + 1]
    currentViewId.value = nextSlide.id
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'i' || event.key === 'I') {
    hideUi.value = !hideUi.value
    isLeftSidebarOpen.value = false
    isInfoSidebarOpen.value = false
  } else if (event.key === 'Escape' && isPresentMode.value) {
    isPresentMode.value = false
  } else if (event.key === 'ArrowLeft' && !disablePrevious.value) {
    onPrevious()
  } else if (event.key === 'ArrowRight' && !disableNext.value) {
    onNext()
  }
}

const hideCloseMessage = () => {
  showCloseMessage.value = false
  if (closeMessageTimeout.value) {
    clearTimeout(closeMessageTimeout.value)
    closeMessageTimeout.value = undefined
  }
}

watch(isPresentMode, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    isLeftSidebarOpen.value = false
    isInfoSidebarOpen.value = false
    showCloseMessage.value = true
    closeMessageTimeout.value = setTimeout(() => {
      showCloseMessage.value = false
    }, 3000)
  } else if (!newVal && oldVal) {
    isLeftSidebarOpen.value = true
    isInfoSidebarOpen.value = true
    hideCloseMessage()
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)

  // Initialize with first public slide after mount
  if (visibleSlides.value && visibleSlides.value.length > 0 && !currentViewId.value) {
    const firstPublicSlide = visibleSlides.value.find(
      (slide) => slide.visibility === SavedViewVisibility.Public
    )
    if (firstPublicSlide) {
      currentViewId.value = firstPublicSlide.id
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  hideCloseMessage()
})
</script>
