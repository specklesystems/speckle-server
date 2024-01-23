<template>
  <ViewerPostSetupWrapper>
    <div class="flex-1">
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

      <ClientOnly>
        <!-- Tour host -->
        <div
          v-if="tourState.showTour"
          class="fixed w-full h-[100dvh] flex justify-center items-center pointer-events-none z-[100]"
        >
          <TourOnboarding />
        </div>
        <!-- Viewer host -->
        <div
          class="special-gradient absolute z-10 overflow-hidden w-screen"
          :class="
            embedOptions.isEnabled
              ? embedOptions.isTransparent
                ? 'h-[100dvh]'
                : 'h-[calc(100dvh-3.5rem)]'
              : 'h-[100dvh]'
          "
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
            <ViewerSelectionSidebar class="z-20" />
          </div>
        </Transition>
        <!-- Shows up when filters are applied for an easy return to normality -->
        <ViewerGlobalFilterReset class="z-20" />
      </ClientOnly>
    </div>
  </ViewerPostSetupWrapper>
  <ViewerEmbedFooter
    :project-name="project?.name"
    :project-created-at="formattedDate"
    :project-url="route.fullPath"
  />
  <Portal to="primary-actions">
    <HeaderNavShare
      v-if="project"
      :model-id="modelId"
      :version-id="versionId"
      :project-id="project.id"
      :visibility="project.visibility"
    />
  </Portal>
</template>
<script setup lang="ts">
import { useEmbedState } from '~~/lib/viewer/composables/setup/embed'
import {
  useSetupViewer,
  type InjectableViewerState
} from '~~/lib/viewer/composables/setup'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { graphql } from '~~/lib/common/generated/gql'

const emit = defineEmits<{
  setup: [InjectableViewerState]
}>()

const route = useRoute()
const { embedOptions } = useEmbedState()
const tourState = useTourStageState()

const projectId = computed(() => route.params.id as string)
const modelId = computed(() => route.params.modelId as string)
const versionId = computed(() => route.params.versionId as string)

const state = useSetupViewer({
  projectId
})

emit('setup', state)

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
    visibility
  }
`)

const title = computed(() =>
  project.value?.name.length ? `Viewer - ${project.value.name}` : ''
)

dayjs.extend(relativeTime)

const formattedDate = computed(() => {
  return project.value?.createdAt ? dayjs(project.value.createdAt).fromNow() : ''
})

useHead({ title })
</script>
