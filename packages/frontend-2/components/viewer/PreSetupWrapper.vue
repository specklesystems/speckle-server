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
            v-if="showTour"
            class="fixed w-full h-[100dvh] flex justify-center items-center pointer-events-none z-[100]"
          >
            <TourOnboarding />
          </div>
          <!-- Viewer host -->
          <div
            class="special-gradient absolute z-10 overflow-hidden w-screen"
            :class="
              isEmbedEnabled
                ? isTransparent
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
              <ViewerAnchoredPoints v-show="showControls" />
            </Transition>
          </div>

          <!-- Global loading bar -->
          <ViewerLoadingBar class="z-20" />

          <!-- Sidebar controls -->
          <Transition
            enter-from-class="opacity-0"
            enter-active-class="transition duration-1000"
          >
            <ViewerControls v-show="showControls" class="z-20" />
          </Transition>

          <!-- Viewer Object Selection Info Display -->
          <Transition
            v-if="!hideSelectionInfo"
            enter-from-class="opacity-0"
            enter-active-class="transition duration-1000"
          >
            <div v-show="showControls">
              <ViewerSelectionSidebar class="z-20" />
            </div>
          </Transition>
          <!-- Shows up when filters are applied for an easy return to normality -->
          <ViewerGlobalFilterReset class="z-20" :embed="!!isEmbedEnabled" />
        </ClientOnly>
      </div>
    </ViewerPostSetupWrapper>
    <ViewerEmbedFooter
      :name="modelName || 'Loading...'"
      :date="lastUpdate"
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
import {
  useSetupViewer,
  type InjectableViewerState
} from '~~/lib/viewer/composables/setup'
import dayjs from 'dayjs'
import { graphql } from '~~/lib/common/generated/gql'
import { useEmbed } from '~/lib/viewer/composables/setup/embed'
import { useViewerTour } from '~/lib/viewer/composables/tour'

const emit = defineEmits<{
  setup: [InjectableViewerState]
}>()

const route = useRoute()
const { showTour, showControls } = useViewerTour()

const projectId = computed(() => route.params.id as string)
const modelId = computed(() => route.params.modelId as string)
const versionId = computed(() => {
  const parts = modelId.value.split('@')
  return parts.length > 1 ? parts[1] : undefined
})

const state = useSetupViewer({
  projectId
})
const { isEnabled: isEmbedEnabled, hideSelectionInfo, isTransparent } = useEmbed()

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

const lastUpdate = computed(() => {
  if (project.value?.models?.items[0] && project.value.models.items[0].updatedAt) {
    return 'Updated ' + dayjs(project.value.models.items[0].updatedAt).fromNow()
  } else if (project.value) {
    return 'Created ' + dayjs(project.value.createdAt).fromNow()
  } else return undefined
})

useHead({ title })
</script>
