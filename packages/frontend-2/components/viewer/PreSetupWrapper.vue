<template>
  <button
    v-if="!isLoaded"
    class="group flex items-center justify-center absolute inset-0"
    @click="isLoaded = true"
  >
    <div
      :class="embedOptions.isTransparent ? '' : '-mt-8'"
      class="group-hover:scale-110 group-hover:shadow-xl shadow h-14 w-14 rounded-full border border-foreground bg-primary flex items-center justify-center transition"
    >
      <PlayIcon class="h-6 w-6 ml-[3px] text-foreground" />
    </div>
  </button>
  <LazyViewerPostSetupWrapper v-else>
    <div class="absolute top-0 left-0 w-screen h-[100dvh]">
      <!-- Nav -->
      <Portal to="navigation">
        <ViewerScope :state="state">
          <HeaderNavLink
            :to="`/projects/${project?.id}`"
            :name="project?.name"
          ></HeaderNavLink>
          <ViewerExplorerNavbarLink />
        </ViewerScope>
      </Portal>

      <!-- Note: commented out until we scope it properly. -->
      <!-- <Portal to="primary-actions">
      <div class="flex space-x-4">
        <FormButton :icon-left="ShareIcon">Share</FormButton>
      </div>
    </Portal> -->

      <ClientOnly>
        <!-- Tour host -->
        <div
          v-if="tourState.showTour"
          class="fixed w-full h-[100dvh] flex justify-center items-center pointer-events-none z-[100]"
        >
          <TourOnboarding />
        </div>
        <!-- Viewer host -->
        <div class="special-gradient absolute w-screen h-[100dvh] z-10 overflow-hidden">
          <ViewerBase />
          <Transition
            enter-from-class="opacity-0"
            enter-active-class="transition duration-1000"
          >
            <ViewerAnchoredPoints v-show="tourState.showViewerControls" />
          </Transition>
        </div>

        <!-- Global loading bar -->
        <ViewerLoadingBar class="z-20" />

        <!-- Sidebar sketches -->
        <Transition
          enter-from-class="opacity-0"
          enter-active-class="transition duration-1000"
        >
          <ViewerControls v-show="tourState.showViewerControls" class="z-20" />
        </Transition>
        <!-- Viewer Object Selection Info Display -->
        <Transition
          v-if="!embedOptions.hideSelectionInfo"
          enter-from-class="opacity-0"
          enter-active-class="transition duration-1000"
        >
          <div v-show="tourState.showViewerControls">
            <ViewerSelectionSidebar class="z-20 hidden sm:block" />
          </div>
        </Transition>
        <!-- Shows up when filters are applied for an easy return to normality -->
        <ViewerGlobalFilterReset class="z-20" />
      </ClientOnly>
    </div>
  </LazyViewerPostSetupWrapper>
  <ViewerEmbedFooter
    :project-name="project?.name"
    :project-created-at="formattedDate"
    :project-url="route.fullPath"
  />
</template>
<script setup lang="ts">
import { useEmbedState } from '~~/lib/viewer/composables/setup/embed'
import { useSetupViewer } from '~~/lib/viewer/composables/setup'
import { PlayIcon } from '@heroicons/vue/20/solid'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

const route = useRoute()
const { embedOptions } = useEmbedState()
const tourState = useTourStageState()

const projectId = computed(() => route.params.id as string)

const state = useSetupViewer({
  projectId
})

const {
  resources: {
    response: { project }
  }
} = state

const isLoaded = ref(true)

const title = computed(() =>
  project.value?.name.length ? `Viewer - ${project.value.name}` : ''
)

dayjs.extend(relativeTime)

const formattedDate = computed(() => {
  return project.value?.createdAt ? dayjs(project.value.createdAt).fromNow() : ''
})

watch(
  embedOptions,
  (newOptions) => {
    if (newOptions.manualLoad === true) {
      isLoaded.value = false
    } else {
      isLoaded.value = true
    }
  },
  { immediate: true }
)

useHead({ title })
</script>
