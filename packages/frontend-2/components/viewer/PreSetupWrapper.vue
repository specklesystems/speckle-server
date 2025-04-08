<template>
  <div>
    <ViewerPostSetupWrapper>
      <div class="flex-1">
        <!-- Nav -->
        <Portal to="navigation">
          <ViewerScope :state="state">
            <template v-if="project?.workspace && isWorkspacesEnabled">
              <HeaderNavLink
                :to="workspaceRoute(project?.workspace.slug)"
                :name="isWorkspaceNewPlansEnabled ? 'Home' : project?.workspace.name"
                :separator="false"
              />
            </template>
            <HeaderNavLink
              v-else
              :to="projectsRoute"
              name="Projects"
              :separator="false"
            />
            <HeaderNavLink :to="`/projects/${project?.id}`" :name="project?.name" />
            <ViewerExplorerNavbarLink />
          </ViewerScope>
        </Portal>

        <ClientOnly>
          <!-- Viewer host -->
          <div
            id="viewer"
            class="viewer special-gradient absolute z-10 overflow-hidden w-screen"
            :class="
              isEmbedEnabled
                ? isTransparent
                  ? 'viewer-transparent h-[100dvh]'
                  : 'h-[calc(100dvh-3.5rem)]'
                : 'h-[100dvh]'
            "
          >
            <ViewerBase />
            <Transition
              enter-from-class="opacity-0"
              enter-active-class="transition duration-1000"
            >
              <ViewerAnchoredPoints />
            </Transition>
          </div>

          <!-- Global loading bar -->
          <ViewerLoadingBar
            class="absolute left-0 w-full z-40 h-30"
            :class="isEmbedEnabled ? 'top-0' : ' -top-2'"
          />

          <!-- Sidebar controls -->
          <ViewerControls v-if="showControls" class="relative z-20" />

          <ViewerLimitsDialog
            v-if="project?.workspace"
            v-model:open="showLimitsDialog"
            :workspace="project?.workspace"
            :project-id="project?.id"
            :resource-id-string="resourceIdString"
            :limit-type="limitsDialogType"
          />

          <!-- Viewer Object Selection Info Display -->
          <Transition
            v-if="!hideSelectionInfo"
            enter-from-class="opacity-0"
            enter-active-class="transition duration-1000"
          >
            <ViewerSelectionSidebar class="z-20" />
          </Transition>
          <div
            class="absolute z-10 w-screen px-8 grid grid-cols-1 sm:grid-cols-3 gap-2"
            :class="isEmbedEnabled ? 'bottom-16 mb-1' : 'bottom-6'"
          >
            <div class="flex items-end justify-center sm:justify-start">
              <PortalTarget name="pocket-left"></PortalTarget>
            </div>
            <div class="flex flex-col gap-2 items-center justify-end">
              <PortalTarget name="pocket-tip"></PortalTarget>
              <div class="flex gap-3">
                <PortalTarget name="pocket-actions"></PortalTarget>
                <!-- Shows up when filters are applied for an easy return to normality -->
                <ViewerGlobalFilterReset
                  v-if="hasAnyFiltersApplied"
                  class="z-20"
                  :embed="!!isEmbedEnabled"
                />
              </div>
            </div>
            <div class="flex items-end justify-center sm:justify-end">
              <PortalTarget name="pocket-right"></PortalTarget>
            </div>
          </div>
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
        :resource-id-string="resourceIdString"
        :project="project"
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
import { useFilterUtilities } from '~/lib/viewer/composables/ui'
import { projectsRoute, workspaceRoute } from '~~/lib/common/helpers/route'
import { useMixpanel } from '~/lib/core/composables/mp'
import { writableAsyncComputed } from '~/lib/common/composables/async'

graphql(`
  fragment ModelPageProject on Project {
    id
    createdAt
    name
    visibility
    workspace {
      id
      slug
      name
    }
  }
`)

const emit = defineEmits<{
  setup: [InjectableViewerState]
}>()

const router = useRouter()
const route = useRoute()
const isWorkspacesEnabled = useIsWorkspacesEnabled()

const resourceIdString = computed(() => route.params.modelId as string)
const projectId = writableAsyncComputed({
  get: () => route.params.id as string,
  set: async (value: string) => {
    // Just rewrite route id param
    await router.push({
      params: { id: value }
    })
  },
  initialState: route.params.id as string,
  asyncRead: false
})

const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()
const state = useSetupViewer({
  projectId
})
const {
  filters: { hasAnyFiltersApplied }
} = useFilterUtilities({ state })
const {
  isEnabled: isEmbedEnabled,
  hideSelectionInfo,
  isTransparent,
  showControls
} = useEmbed()
const mp = useMixpanel()

emit('setup', state)

const {
  resources: {
    response: { project, resourceItems, modelsAndVersionIds }
  },
  urlHashState: { focusedThreadId }
} = state

const showLimitsDialog = ref(false)
const limitsDialogType = ref<'version' | 'comment' | 'federated'>('version')

// Check for missing referencedObject in url referenced versions (out of plan limits)
const hasMissingReferencedObject = computed(() => {
  const resourceIds = resourceIdString.value.split(',')

  const result = modelsAndVersionIds.value.some((item) => {
    const version = item.model?.versions?.items?.find((v) => v.id === item.versionId)

    if (version && version.referencedObject === null) {
      // Check if this model+version is in the URL (latest version always available)
      const modelVersionString = `${item.model.id}@${item.versionId}`.toLowerCase()
      const isInUrl = resourceIds.some((r) => r.toLowerCase() === modelVersionString)

      return isInUrl
    }

    return false
  })

  return result
})

// Check for missing thread when a specific threadId is present in URL
const hasMissingThread = computed(() => {
  const threadIdFromUrl = focusedThreadId.value

  if (!threadIdFromUrl) return false

  const thread = state.resources.response.commentThreads.value.find(
    (thread) => thread.id === threadIdFromUrl
  )

  return !thread || !thread.rawText
})

const isFederated = computed(
  () => state.resources.response.resourceItems.value.length > 1
)

const title = computed(() => {
  if (project.value?.models?.items) {
    const modelCount = project.value.models.items.length
    const projectName = project.value.name || ''

    if (modelCount > 1) {
      return projectName ? `Multiple models - ${projectName}` : 'Multiple models'
    } else if (modelCount === 1) {
      const modelName = project.value.models.items[0].name || ''
      return projectName ? `${modelName} - ${projectName}` : modelName
    }
  }
  return ''
})

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

onMounted(() => {
  const referrer = document.referrer
  const shouldTrackEvent = !referrer?.includes('speckle.systems') && !import.meta.dev

  if (isEmbedEnabled.value && shouldTrackEvent) {
    mp.track('Embedded Model Load')
  }
})

// Watch for plan limit conditions and show dialog if needed
watch(
  [hasMissingReferencedObject, hasMissingThread, resourceItems, project],
  ([missingObject, missingThread]) => {
    if (missingObject) {
      if (isFederated.value) {
        limitsDialogType.value = 'federated'
      } else {
        limitsDialogType.value = 'version'
      }
      showLimitsDialog.value = true
      return
    }

    // If no workspace and no missing objects, don't show dialog
    if (!project.value?.workspace) {
      showLimitsDialog.value = false
      return
    }

    if (missingThread) {
      limitsDialogType.value = 'comment'
      showLimitsDialog.value = true
    } else {
      showLimitsDialog.value = false
    }
  },
  { immediate: true }
)
</script>
