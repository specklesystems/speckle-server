<template>
  <div>
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
          <ViewerGlobalFilterReset class="z-20" :embed="embedOptions.isEnabled" />
        </ClientOnly>
      </div>
    </ViewerPostSetupWrapper>
    <ViewerEmbedFooter
      :name="modelName || 'Loading...'"
      :created-at="formattedDate"
      :url="route.path"
    />
    <Portal to="primary-actions">
      <HeaderNavShare
        v-if="project"
        :resource-id-string="modelId"
        :version-id="versionId"
        :project-id="project.id"
        :visibility="project.visibility"
      />
    </Portal>
  </div>
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
const versionId = computed(() => {
  const parts = modelId.value.split('@')
  return parts.length > 1 ? parts[1] : undefined
})

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

const modelName = computed(() => {
  if (project.value?.models?.items && project.value.models.items.length > 0) {
    return project.value.models.items[0].name
  } else {
    return project.value?.name
  }
})
dayjs.extend(relativeTime)

const formattedDate = computed(() => {
  return project.value?.createdAt ? dayjs(project.value.createdAt).fromNow() : ''
})

useHead({ title })
</script>
