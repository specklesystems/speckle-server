<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="lg"
    :buttons="isPrivate ? nonDiscoverableButtons : discoverableButtons"
  >
    <template v-if="isPrivate" #header>Change access permissions</template>
    <template v-else #header>Embed model</template>

    <div v-if="isPrivate">
      <CommonAlert color="info">
        <template #title>
          Model embedding does not work when the project is "Private".
        </template>
      </CommonAlert>

      <ProjectPageTeamDialogManagePermissions
        :project="project"
        @changed-visibility="handleChangeVisibility"
      />
    </div>
    <div v-else>
      <CommonAlert v-if="multipleVersionedResources" class="mb-4 sm:-mt-4" color="info">
        <template #title>You are embedding a specific version</template>
        <template #description>
          <p>
            This means that any changes you made after this version will not be included
            in the embedded model.
          </p>
          <p>
            <strong>Tip:</strong>
            If you want to share the latest version of your model, go back to the
            project dashboard and start the embedding process from there.
          </p>
        </template>
      </CommonAlert>

      <div class="flex flex-col lg:flex-row gap-8 mb-6">
        <div class="flex-1 order-1 lg:order-2">
          <h4 class="text-heading-sm text-foreground-2 mb-1 ml-0.5">Embed code</h4>
          <FormClipboardInput :value="iframeCode" is-multiline />
          <p class="text-body-xs text-foreground-2 mt-2 mb-5 ml-0.5">
            Copy this code to embed your model in a webpage or document.
          </p>
          <LayoutDialogSection border-b border-t title="Options">
            <template #icon>
              <Cog6ToothIcon class="h-full w-full" />
            </template>
            <div class="flex flex-col gap-1.5 sm:gap-2 text-body-xs cursor-default">
              <div v-for="option in embedDialogOptions" :key="option.id">
                <label
                  :for="`option-${option.id}`"
                  class="flex items-center gap-1 cursor-pointer max-w-max"
                >
                  <FormCheckbox
                    :id="`option-${option.id}`"
                    :model-value="option.value.value"
                    :name="option.label"
                    hide-label
                    class="cursor-pointer"
                    @update:model-value="
                      (newValue) => updateOption(option.value, newValue)
                    "
                  />
                  <span>{{ option.label }}</span>
                </label>
              </div>
            </div>
          </LayoutDialogSection>
          <LayoutDialogSection
            v-if="!isSmallerOrEqualSm"
            lazy-load
            border-b
            title="Preview"
          >
            <template #icon>
              <EyeIcon class="h-full w-full" />
            </template>
            <ProjectModelPageDialogEmbedIframe
              v-if="!isSmallerOrEqualSm"
              :src="updatedUrl"
              title="Preview"
              width="600"
              height="400"
              class="shrink-0 w-[600px] h-[400px] mx-auto border border-outline-2"
            />
          </LayoutDialogSection>
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { Cog6ToothIcon, EyeIcon } from '@heroicons/vue/24/outline'
import {
  ProjectVisibility,
  type ProjectsModelPageEmbed_ProjectFragment
} from '~~/lib/common/generated/gql/graphql'
import { useClipboard } from '~~/composables/browser'
import { SpeckleViewer } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useUpdateProject } from '~/lib/projects/composables/projectManagement'
import { useMixpanel } from '~/lib/core/composables/mp'

graphql(`
  fragment ProjectsModelPageEmbed_Project on Project {
    id
    ...ProjectsPageTeamDialogManagePermissions_Project
  }
`)

const props = defineProps<{
  project: ProjectsModelPageEmbed_ProjectFragment
  modelId?: string
  versionId?: string
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const route = useRoute()
const logger = useLogger()
const { copy } = useClipboard()
const {
  public: { baseUrl }
} = useRuntimeConfig()

const { isSmallerOrEqualSm } = useIsSmallerOrEqualThanBreakpoint()
const updateProject = useUpdateProject()
const mp = useMixpanel()

const transparentBackground = ref(false)
const hideViewerControls = ref(false)
const hideSelectionInfo = ref(false)
const preventScrolling = ref(false)
const manuallyLoadModel = ref(false)
const projectVisibility = ref(props.project.visibility)

const routeModelId = computed(() => route.params.modelId as string)

const parsedResources = computed(() =>
  SpeckleViewer.ViewerRoute.parseUrlParameters(routeModelId.value)
)

const multipleVersionedResources = computed(() => {
  return (
    parsedResources.value.filter(
      (resource) =>
        SpeckleViewer.ViewerRoute.isModelResource(resource) &&
        resource.versionId !== undefined
    ).length > 1
  )
})

const updatedUrl = computed(() => {
  const url = new URL(`/projects/${encodeURIComponent(props.project.id)}`, baseUrl)

  url.pathname += '/models/'

  // Use props.modelId and props.versionId if provided
  if (props.modelId) {
    let modelPath = encodeURIComponent(props.modelId)
    if (props.versionId) {
      modelPath += `@${encodeURIComponent(props.versionId)}`
    }
    url.pathname += modelPath
  } else {
    // Otherwise, use routeModelId directly
    url.pathname += routeModelId.value
  }

  // Construct the embed options as a hash fragment
  const embedOptions: Record<string, boolean> = { isEnabled: true }
  embedDialogOptions.forEach((option) => {
    if (option.value.value) {
      embedOptions[option.id] = true
    }
  })

  // Serialize the embedOptions into a hash fragment
  const hashFragment = encodeURIComponent(JSON.stringify(embedOptions))
  url.hash = `embed=${hashFragment}`

  return url.toString()
})

const iframeCode = computed(() => {
  return `<iframe title="Speckle" src="${updatedUrl.value}" width="600" height="400" frameborder="0"></iframe>`
})

const isPrivate = computed(() => {
  return props.project.visibility === ProjectVisibility.Private
})

const discoverableButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Copy embed code',
    props: {},
    onClick: () => {
      handleEmbedCodeCopy(iframeCode.value)
    }
  }
])

const nonDiscoverableButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Close',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Save',
    props: {
      disabled: projectVisibility.value === props.project.visibility
    },
    onClick: saveProjectVisibility
  }
])

const handleEmbedCodeCopy = async (value: string) => {
  await copy(value, {
    successMessage: 'Embed code copied to clipboard',
    failureMessage: 'Failed to copy embed code to clipboard'
  })
}

const updateOption = (optionRef: Ref<boolean>, newValue: unknown) => {
  optionRef.value = newValue === undefined ? false : !!newValue
}

const handleChangeVisibility = (newVisibility: ProjectVisibility) => {
  projectVisibility.value = newVisibility
}

const saveProjectVisibility = async () => {
  try {
    await updateProject({
      visibility: projectVisibility.value,
      id: props.project.id
    })
    mp.track('Stream Action', {
      type: 'action',
      name: 'update',
      action: 'project-access',
      to: projectVisibility.value
    })
  } catch (e) {
    logger.error(e)
  }
}

const embedDialogOptions = [
  {
    id: 'isTransparent',
    label: 'Transparent background',
    value: transparentBackground
  },
  {
    id: 'hideControls',
    label: 'Hide viewer controls',
    value: hideViewerControls
  },
  {
    id: 'hideSelectionInfo',
    label: 'Hide the selection info panel',
    value: hideSelectionInfo
  },
  {
    id: 'noScroll',
    label: 'Prevent scrolling (zooming)',
    value: preventScrolling
  },
  {
    id: 'manualLoad',
    label: 'Load model manually',
    value: manuallyLoadModel
  }
]
</script>
