<template>
  <div class="relative">
    <div class="h-screen w-screen flex flex-col md:flex-row relative">
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
        class="absolute top-4 right-4 z-20"
        :class="{ 'lg:right-[21rem]': isInfoSidebarOpen }"
        @toggle-sidebar="isInfoSidebarOpen = !isInfoSidebarOpen"
      />

      <PresentationSlideIndicator
        class="absolute top-1/2 -translate-y-1/2 z-20"
        :current-slide-index="currentSlideIndex"
        :slide-count="slides.length || 0"
        :class="[isLeftSidebarOpen ? 'lg:left-[15.75rem] hidden md:block' : 'left-4']"
      />

      <PresentationLeftSidebar
        v-if="isLeftSidebarOpen"
        class="absolute left-0 top-0 md:relative flex-shrink-0 z-30"
        :slides="slides"
        :workspace-logo="workspace?.logo"
        :workspace-name="workspace?.name"
        :current-slide="currentSlide"
        @select-slide="onSelectSlide"
      />

      <div class="flex-1">
        <ClientOnly>
          <img
            :src="currentSlide.screenshot"
            alt="Current view"
            class="h-full w-full object-cover"
          />
        </ClientOnly>
      </div>

      <PresentationInfoSidebar
        v-if="isInfoSidebarOpen"
        class="flex-shrink-0"
        :title="currentSlide.name"
        :description="currentSlide.description"
        :view-id="currentSlide.id"
        :project-id="projectId"
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
        views(input: $input) {
          totalCount
          items {
            ...PresentationLeftSidebar_SavedView
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

const currentSlideIndex = ref<number>(0)
const isInfoSidebarOpen = ref(true)
const isLeftSidebarOpen = ref(true)
const hideUi = ref(false)

const workspace = computed(() => result.value?.project.workspace)
const presentation = computed(() => result.value?.project.savedViewGroup)

const slides = computed(
  () =>
    result.value?.project.savedViewGroup.views.items.filter(
      (view) => view.visibility === SavedViewVisibility.Public
    ) || []
)
const currentSlide = computed(() => slides.value[currentSlideIndex.value])

const disablePrevious = computed(() => currentSlideIndex.value === 0)
const disableNext = computed(() =>
  slides.value.length ? currentSlideIndex.value === slides.value.length - 1 : false
)

const onSelectSlide = (slideId: string) => {
  currentSlideIndex.value = slides.value.findIndex((slide) => slide.id === slideId)
}

const onPrevious = () => {
  if (currentSlideIndex.value > 0) {
    currentSlideIndex.value--
  }
}

const onNext = () => {
  if (currentSlideIndex.value < slides.value.length - 1) {
    currentSlideIndex.value++
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'i' || event.key === 'I') {
    hideUi.value = !hideUi.value
    isLeftSidebarOpen.value = false
    isInfoSidebarOpen.value = false
  } else if (event.key === 'ArrowLeft' && !disablePrevious.value) {
    onPrevious()
  } else if (event.key === 'ArrowRight' && !disableNext.value) {
    onNext()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>
