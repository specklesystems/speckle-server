<template>
  <ViewerPostSetupWrapper>
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
          v-if="viewerState.showTour"
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
            <ViewerAnchoredPoints v-show="viewerState.showViewerControls" />
          </Transition>
        </div>

        <!-- Global loading bar -->
        <ViewerLoadingBar class="z-20" />

        <!-- Sidebar sketches -->
        <Transition
          enter-from-class="opacity-0"
          enter-active-class="transition duration-1000"
        >
          <ViewerControls v-show="viewerState.showViewerControls" class="z-20" />
        </Transition>
        <!-- Viewer Object Selection Info Display -->
        <Transition
          enter-from-class="opacity-0"
          enter-active-class="transition duration-1000"
        >
          <div v-show="viewerState.showViewerControls">
            <ViewerSelectionSidebar class="z-20 hidden sm:block" />
          </div>
        </Transition>
        <!-- Shows up when filters are applied for an easy return to normality -->
        <ViewerGlobalFilterReset class="z-20" />
      </ClientOnly>
    </div>
  </ViewerPostSetupWrapper>
  <div
    v-if="viewerState.showViewerControls"
    class="sm:hidden shadow-t fixed bottom-0 left-0 max-h-[65vh] overflow-hidden w-screen z-50 transition-all duration-300 empty:-bottom-[65vh]"
  >
    <PortalTarget name="bottomPanel"></PortalTarget>
    <PortalTarget name="mobileComments"></PortalTarget>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useSetupViewer } from '~~/lib/viewer/composables/setup'
import { useEmbedState } from '~~/lib/viewer/composables/setup/embed'

definePageMeta({
  layout: 'viewer',
  middleware: ['require-valid-project'],
  pageTransition: false, // NOTE: transitions fuck viewer up
  layoutTransition: false,
  key: '/projects/:id/models/resources' // To prevent controls flickering on resource url param changes
})

graphql(`
  fragment ModelPageProject on Project {
    id
    createdAt
    name
  }
`)

const viewerState = useTourStageState()
const route = useRoute()
const projectId = computed(() => route.params.id as string)

const { embedOptions } = useEmbedState()

const state = useSetupViewer({
  projectId
})

const {
  resources: {
    response: { project }
  }
} = state

const title = computed(() =>
  project.value?.name.length ? `Viewer - ${project.value.name}` : ''
)
useHead({ title })

watch(
  embedOptions,
  (newOptions) => {
    if (newOptions.isTransparent) {
      console.log('is transparent')
    }
    if (newOptions.hideControls) {
      viewerState.value.showViewerControls = false
    }
    if (newOptions.hideSelectionInfo) {
      console.log('hide selection info')
    }
    if (newOptions.noScroll) {
      console.log('no scroll')
    }
    if (newOptions.autoload) {
      console.log('autoload')
    }
  },
  { immediate: true }
)
</script>
