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
        <button
          v-if="!isLoaded"
          class="group flex items-center justify-center h-full w-full"
          @click="isLoaded = true"
        >
          <div
            :class="embedOptions.isTransparent ? '' : '-mt-8'"
            class="group-hover:scale-110 group-hover:shadow-xl shadow h-14 w-14 rounded-full border border-foreground bg-primary flex items-center justify-center transition"
          >
            <PlayIcon class="h-6 w-6 ml-[3px] text-foreground" />
          </div>
        </button>
        <div v-else>
          <!-- Tour host -->
          <div
            v-if="tourState.showTour"
            class="fixed w-full h-[100dvh] flex justify-center items-center pointer-events-none z-[100]"
          >
            <TourOnboarding />
          </div>
          <!-- Viewer host -->
          <div
            class="special-gradient absolute w-screen h-[100dvh] z-10 overflow-hidden"
          >
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
        </div>
      </ClientOnly>
    </div>
  </ViewerPostSetupWrapper>
  <div
    class="fixed shadow-t bottom-0 left-0 max-h-[65vh] overflow-hidden w-screen z-50 transition-all duration-300 empty:-bottom-[65vh]"
  >
    <PortalTarget class="sm:hidden" name="bottomPanel"></PortalTarget>
    <PortalTarget class="sm:hidden" name="mobileComments"></PortalTarget>
  </div>
  <div
    v-if="embedOptions.isEnabled"
    class="select-none fixed bottom-0 left-0 w-full z-20 flex"
    :class="
      embedOptions.isTransparent
        ? 'justify-end'
        : 'items-center gap-4 bg-foundation px-3 py-2.5'
    "
  >
    <NuxtLink href="https://speckle.systems/" target="_blank">
      <HeaderLogoBlock
        powered-by
        :class="embedOptions.isTransparent ? 'scale-75' : ''"
      />
    </NuxtLink>
    <div v-if="!embedOptions.isTransparent" class="h-6 w-px bg-primary"></div>
    <div v-if="!embedOptions.isTransparent" class="flex flex-col">
      <NuxtLink :to="route.fullPath" target="_blank">
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
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useSetupViewer } from '~~/lib/viewer/composables/setup'
import { useEmbedState } from '~~/lib/viewer/composables/setup/embed'
import { ArrowTopRightOnSquareIcon, PlayIcon } from '@heroicons/vue/20/solid'
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

const isLoaded = ref(true)

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
</script>
