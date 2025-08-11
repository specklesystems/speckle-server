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
                name="Projects"
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
              <ViewerAnchoredPoints
                ref="anchoredPoints"
                @force-close-panels="() => closeAllPanels('threads')"
              />
            </Transition>
          </div>

          <!-- Global loading bar -->
          <ViewerLoadingBar
            class="absolute left-0 w-full z-40 h-30"
            :class="isEmbedEnabled ? 'top-0' : ' -top-2'"
          />

          <!-- Controls -->
          <!-- <ViewerControls v-if="showControls" class="relative z-20" /> -->
          <template v-if="showControls">
            <ViewerControlsLeft
              ref="leftControls"
              @force-close-panels="() => closeAllPanels('left')"
            />
            <ViewerControlsBottom
              ref="bottomControls"
              @force-close-panels="() => closeAllPanels('bottom')"
            />
            <ViewerControlsRight v-if="isMobile" />
          </template>

          <ViewerLimitsDialog
            v-if="project"
            v-model:open="showLimitsDialog"
            :project="project"
            :resource-id-string="resourceIdString"
            :limit-type="limitsDialogType"
          />

          <!-- Viewer Object Selection Info Display -->
          <Transition
            v-if="!hideSelectionInfo"
            enter-from-class="opacity-0"
            enter-active-class="transition duration-1000"
          >
            <ViewerSelectionSidebar ref="selectionSidebar" class="z-20" />
          </Transition>
          <div
            class="absolute z-10 w-screen px-8 grid grid-cols-1 sm:grid-cols-3 gap-2 top-[3.75rem]"
          >
            <div class="flex items-end justify-center sm:justify-start">
              <PortalTarget name="pocket-left"></PortalTarget>
            </div>
            <div class="flex flex-col gap-2 items-center justify-end">
              <PortalTarget name="pocket-tip"></PortalTarget>
              <div class="flex gap-3">
                <PortalTarget name="pocket-actions"></PortalTarget>
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
      :hide-speckle-branding="hideSpeckleLogo"
      :disable-model-link="disableModelLink"
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
import { projectsRoute, workspaceRoute } from '~~/lib/common/helpers/route'
import { useMixpanel } from '~/lib/core/composables/mp'
import { writableAsyncComputed } from '~/lib/common/composables/async'
import { parseUrlParameters, resourceBuilder } from '@speckle/shared/viewer/route'
import { ViewerLimitsDialogType } from '~/lib/projects/helpers/limits'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
import { useBreakpoints } from '@vueuse/core'

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
      role
    }
    embedOptions {
      hideSpeckleBranding
    }
    hasAccessToFeature(featureName: hideSpeckleBranding)
    ...ViewerLimitsDialog_Project
  }
`)

const emit = defineEmits<{
  setup: [InjectableViewerState]
}>()

const router = useRouter()
const route = useRoute()
const isWorkspacesEnabled = useIsWorkspacesEnabled()
const breakpoints = useBreakpoints(TailwindBreakpoints)
const isMobile = breakpoints.smaller('sm')

const leftControls = ref()
const bottomControls = ref()
const selectionSidebar = ref()
const anchoredPoints = ref()

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

const state = useSetupViewer({
  projectId
})
const {
  isEnabled: isEmbedEnabled,
  hideSelectionInfo,
  isTransparent,
  showControls,
  disableModelLink,
  hideSpeckleBranding
} = useEmbed()
const mp = useMixpanel()

emit('setup', state)

const {
  resources: {
    response: { project, modelsAndVersionIds }
  }
} = state

const showLimitsDialog = ref(false)
const limitsDialogType = ref<ViewerLimitsDialogType>(ViewerLimitsDialogType.Version)

// Check for missing referencedObject in url referenced versions (out of plan limits)
const hasMissingReferencedObject = computed(() => {
  const resources = parseUrlParameters(resourceIdString.value)

  const result = modelsAndVersionIds.value.some((item) => {
    const version = item.model?.loadedVersion?.items?.find(
      (v) => v.id === item.versionId
    )

    if (!version || version.referencedObject === null) {
      const modelVersionString = resourceBuilder()
        .addModel(item.model.id, item.versionId)
        .toString()
      const isInUrl = resources.some(
        (r) => r.toString().toLowerCase() === modelVersionString
      )

      return isInUrl
    }

    return false
  })

  return result
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

const canEditEmbedOptions = computed(() => {
  return project.value?.hasAccessToFeature
})

const hideSpeckleLogo = computed(() => {
  if (!project.value?.workspace) return true
  if (!canEditEmbedOptions.value) return false
  if (project.value?.embedOptions?.hideSpeckleBranding) return true
  else return hideSpeckleBranding.value
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
  [hasMissingReferencedObject, state.resources.response.resourcesLoading],
  ([missingObject, resourcesLoading]: [boolean, boolean]) => {
    // Only show dialog if resources are not loading to prevent flashing during version switches
    if (missingObject && !resourcesLoading) {
      if (isFederated.value) {
        limitsDialogType.value = 'federated'
      } else {
        limitsDialogType.value = 'version'
      }
      showLimitsDialog.value = true
    } else {
      showLimitsDialog.value = false
    }
  },
  { immediate: true }
)

const closeAllPanels = (except?: 'left' | 'bottom' | 'threads') => {
  if (except !== 'left' && leftControls.value?.forceClosePanels) {
    leftControls.value.forceClosePanels()
  }
  if (except !== 'bottom' && bottomControls.value?.forceClosePanels) {
    bottomControls.value.forceClosePanels()
  }
  if (except !== 'threads' && anchoredPoints.value?.forceCloseThreads) {
    anchoredPoints.value.forceCloseThreads()
  }

  selectionSidebar.value.forceClose()
}
</script>
