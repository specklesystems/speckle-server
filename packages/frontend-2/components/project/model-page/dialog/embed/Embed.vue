<template>
  <LayoutDialog
    v-model:open="isOpen"
    :max-width="visibility == ProjectVisibility.Private ? 'sm' : 'md'"
    :buttons="
      visibility == ProjectVisibility.Private
        ? nonDiscoverableButtons
        : discoverableButtons
    "
  >
    <template #header>Embed Model</template>
    <div v-if="visibility === ProjectVisibility.Private">
      <p>
        <strong>Model embedding only works if the project is “Discoverable”.</strong>
      </p>
      <p class="mt-5">
        To change this setting you must be logged in as a user with the
        <strong>Owner</strong>
        project permission.
      </p>
      <p>
        Go to
        <strong>“Project Dashboard > Manage > Access”</strong>
        and choose
        <strong>“Discoverable”</strong>
        from the drop-down list.
      </p>
    </div>
    <div v-else>
      <CommonAlert v-if="multipleVersionedResources" class="mb-4 sm:-mt-4" color="info">
        <template #title>You are about embedding a specific version</template>
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
          <h4 class="font-bold text-sm text-foreground-2 mb-2 ml-0.5">Embed Code</h4>
          <FormClipboardInput :value="iframeCode" is-multiline />
          <p class="text-sm sm:text-base text-foreground-2 mt-2 mb-5 ml-0.5">
            Copy this code to embed your model in a webpage or document.
          </p>
          <LayoutDialogSection border-b border-t title="Options">
            <template #icon>
              <Cog6ToothIcon class="h-full w-full" />
            </template>
            <div
              class="flex flex-col gap-1.5 sm:gap-2 ml-5 sm:ml-7 text-sm cursor-default"
            >
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
              class="shrink-0 w-[600px] h-[400px] mx-auto"
            />
          </LayoutDialogSection>
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Cog6ToothIcon, EyeIcon } from '@heroicons/vue/24/outline'
import { ProjectVisibility } from '~~/lib/common/generated/gql/graphql'
import { useClipboard } from '~~/composables/browser'
import { SpeckleViewer } from '@speckle/shared'
import { projectRoute } from '~~/lib/common/helpers/route'

const props = defineProps<{
  visibility?: ProjectVisibility
  projectId: string
  modelId?: string
  versionId?: string
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const router = useRouter()
const route = useRoute()
const { copy } = useClipboard()
const {
  public: { baseUrl }
} = useRuntimeConfig()

const { isSmallerOrEqualSm } = useIsSmallerOrEqualThanBreakpoint()

const transparentBackground = ref(false)
const hideViewerControls = ref(false)
const hideSelectionInfo = ref(false)
const preventScrolling = ref(false)
const manuallyLoadModel = ref(false)

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
  const url = new URL(`/projects/${encodeURIComponent(props.projectId)}`, baseUrl)

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

const discoverableButtons = computed(() => [
  {
    text: 'Cancel',
    props: { color: 'invert', fullWidth: true, outline: true },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Copy Embed Code',
    props: { color: 'primary', fullWidth: true },
    onClick: () => {
      handleEmbedCodeCopy(iframeCode.value)
    }
  }
])

const nonDiscoverableButtons = computed(() => [
  {
    text: 'Close',
    props: { color: 'invert', fullWidth: true, outline: true },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Change Access',
    props: { color: 'primary', fullWidth: true },
    onClick: () => {
      isOpen.value = false
      router.push(`${projectRoute(props.projectId)}?settings=access`)
    }
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
    label: 'Hide the Selection Info panel',
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
