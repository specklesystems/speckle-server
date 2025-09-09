<template>
  <div class="relative">
    <PresentationHeader
      v-if="!hideUi"
      v-model:is-sidebar-open="isLeftSidebarOpen"
      class="absolute top-4 left-4"
      :title="presentation?.title"
      :class="{ 'left-[15.75rem]': isLeftSidebarOpen }"
      @toggle-sidebar="isLeftSidebarOpen = !isLeftSidebarOpen"
    />
    <PresentationActions
      v-if="!hideUi"
      v-model:is-sidebar-open="isInfoSidebarOpen"
      class="absolute top-4 right-4"
      :class="{ 'right-[21rem]': isInfoSidebarOpen }"
      @toggle-sidebar="isInfoSidebarOpen = !isInfoSidebarOpen"
    />

    <PresentationSlideIndicator
      class="absolute left-4 top-1/2 -translate-y-1/2"
      :current-slide-index="currentViewIndex"
      :slide-count="viewsCount || 0"
      :class="{ 'left-[15.75rem]': isLeftSidebarOpen }"
    />

    <div class="h-screen w-screen flex">
      <PresentationLeftSidebar
        v-if="isLeftSidebarOpen"
        class="flex-shrink-0"
        :slides="presentation"
        :workspace-logo="workspace?.logo"
        :workspace-name="workspace?.name"
        :current-slide-index="currentViewIndex"
        @select-slide="currentViewIndex = $event"
      />

      <div class="flex-1">
        <img
          :src="currentView?.screenshot"
          alt="Current view"
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
      />
    </div>

    <PresentationControls
      v-if="!hideUi"
      class="absolute bottom-4 left-1/2 -translate-x-1/2"
      :disable-previous="disablePrevious"
      :disable-next="disableNext"
      @on-previous="onPrevious"
      @on-next="onNext"
    />

    <PresentationSpeckleLogo class="absolute bottom-4 right-4 z-20" />

    <!-- <div
      v-if="!hideUi"
      class="bg-foundation border border-outline-3 rounded-xl shadow-md h-10 flex items-center absolute right-4 bottom-4 p-1"
      :class="{ 'right-[21rem]': isInfoSidebarOpen }"
    >
      <button
        class="size-8 flex items-center justify-center bg-foundation rounded-xl hover:bg-info-lighter hover:text-primary-focus"
      >
        <LucideFullscreen class="size-4" />
      </button>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'

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
        views(input: $input) {
          totalCount
          items {
            id
            name
            screenshot
            description
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

const currentViewIndex = ref(0)
const isInfoSidebarOpen = ref(false)
const isLeftSidebarOpen = ref(false)
const hideUi = ref(false)

const workspace = computed(() => result.value?.project.workspace)
const currentView = computed(
  () => result.value?.project.savedViewGroup.views.items[currentViewIndex.value]
)
const viewsCount = computed(() => result.value?.project.savedViewGroup.views.totalCount)
const presentation = computed(() => result.value?.project.savedViewGroup)
const disablePrevious = computed(() => currentViewIndex.value === 0)
const disableNext = computed(() =>
  viewsCount.value ? currentViewIndex.value === viewsCount.value - 1 : false
)
const onPrevious = () => {
  currentViewIndex.value--
}

const onNext = () => {
  currentViewIndex.value++
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'i' || event.key === 'I') {
    hideUi.value = !hideUi.value
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
