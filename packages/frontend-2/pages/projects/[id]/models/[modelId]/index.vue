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
  </ViewerPostSetupWrapper>
  <div
    class="fixed bottom-0 left-0 max-h-[65vh] overflow-hidden w-screen z-50 transition-all duration-300 empty:-bottom-[65vh]"
    :class="embedOptions.isTransparent ? '' : 'shadow-t'"
  >
    <PortalTarget class="sm:hidden" name="bottomPanel"></PortalTarget>
    <PortalTarget class="sm:hidden" name="mobileComments"></PortalTarget>
    <div
      v-if="embedOptions.isEnabled"
      :class="
        embedOptions.isTransparent
          ? 'grid'
          : 'flex bg-foundation px-3 py-2.5 items-center gap-3'
      "
      class="select-none"
    >
      <HeaderLogoBlock
        powered-by
        :class="embedOptions.isTransparent ? 'max-w-max justify-self-end' : ''"
      />
      <div v-if="!embedOptions.isTransparent" class="h-6 w-px bg-primary"></div>
      <div v-if="!embedOptions.isTransparent" class="flex flex-col">
        <NuxtLink>
          <div class="flex items-center gap-1 -mb-1.5">
            <h2 class="font-bold text-base text-sm">
              {{ project?.name }}
            </h2>
            <ArrowTopRightOnSquareIcon class="h-3 w-3" />
          </div>
          <span class="text-xs text-foreground-2">Created {{ formattedDate }}</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useSetupViewer } from '~~/lib/viewer/composables/setup'
import { useEmbedState } from '~~/lib/viewer/composables/setup/embed'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/20/solid'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

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

const tourState = useTourStageState()
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

dayjs.extend(relativeTime)

const formattedDate = computed(() => {
  return project.value?.createdAt ? dayjs(project.value.createdAt).fromNow() : ''
})

const title = computed(() =>
  project.value?.name.length ? `Viewer - ${project.value.name}` : ''
)
useHead({ title })
</script>
