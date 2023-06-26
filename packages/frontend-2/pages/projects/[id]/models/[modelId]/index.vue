<template>
  <ViewerPostSetupWrapper>
    <div class="absolute top-0 left-0 w-screen h-screen">
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
          class="fixed w-full h-full flex justify-center items-center pointer-events-none z-[100]"
        >
          <TourOnboarding />
        </div>
        <!-- Viewer host -->
        <div class="special-gradient absolute w-screen h-screen z-10 overflow-hidden">
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
          enter-from-class="opacity-0"
          enter-active-class="transition duration-1000"
        >
          <ViewerSelectionSidebar v-show="tourState.showViewerControls" class="z-20" />
        </Transition>
        <!-- Shows up when filters are applied for an easy return to normality -->
        <ViewerGlobalFilterReset class="z-20" />
      </ClientOnly>
    </div>
  </ViewerPostSetupWrapper>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useSetupViewer } from '~~/lib/viewer/composables/setup'

const tourState = useTourStageState()

definePageMeta({
  layout: 'viewer',
  middleware: ['require-valid-project'],
  pageTransition: false, // NOTE: transitions fuck viewer up
  layoutTransition: false,
  key: '/projects/:id/models/resources' // To prevent controls flickering on resource url param changes
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)

const state = useSetupViewer({
  projectId
})

const {
  resources: {
    response: { project }
  }
} = state

graphql(`
  fragment ModelPageProject on Project {
    id
    createdAt
    name
  }
`)
</script>
