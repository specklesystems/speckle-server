<template>
  <LayoutDialog
    v-model:open="isOpen"
    :max-width="visibility == projectVisibility.Private ? 'sm' : 'md'"
    :buttons="
      visibility == projectVisibility.Private
        ? nonDiscoverableButtons
        : discoverableButtons
    "
  >
    <template #header>Embed Model</template>
    <div v-if="visibility === projectVisibility.Private">
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
      <CommonAlert v-if="props.versionId" class="mb-4 -mt-4" color="info">
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
          <h4 class="font-bold text-sm text-foreground-2 mb-2 ml-0.5">Code</h4>
          <FormClipboardInput :value="iframeCode" is-multiline />
          <p class="text-sm sm:text-base text-foreground-2 mt-2 mb-5 ml-0.5">
            Copy this code to embed an iframe of model in your webpage or document.
          </p>
          <LayoutDialogSection border-b border-t title="Embed Options">
            <template #icon>
              <Cog6ToothIcon class="h-full w-full" />
            </template>
            <div
              class="flex flex-col gap-1.5 sm:gap-2 ml-7 text-xs sm:text-sm cursor-default"
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
            border-b
            title="Preview"
            :lazy-load="true"
            :lazy-load-height="400"
          >
            <template #icon>
              <EyeIcon class="h-full w-full" />
            </template>
            <LazyProjectModelPageDialogEmbedIframe
              :src="updatedUrl"
              title="Preview"
              width="600"
              height="400"
              class="shrink-0 w-[600px] h-[400px] mx-auto"
              :condition="!isSmallerOrEqualSm"
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
import { ProjectVisibility } from '~/lib/common/generated/gql/graphql'
import { useClipboard } from '~~/composables/browser'

const props = defineProps<{
  visibility?: ProjectVisibility
  projectId: string
  modelId: string
  versionId?: string
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const router = useRouter()
const { copy } = useClipboard()
const {
  public: { baseUrl }
} = useRuntimeConfig()

const { isSmallerOrEqualSm } = useIsSmallerOrEqualThanBreakpoint()

const projectVisibility = ref(ProjectVisibility)

const transparentBackground = ref(false)
const hideViewerControls = ref(false)
const hideSelectionInfo = ref(false)
const preventScrolling = ref(false)
const manuallyLoadModel = ref(false)
const commentSlideshowMode = ref(false)

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
  },
  {
    id: 'commentSlideshow',
    label: 'Comment slideshow mode',
    value: commentSlideshowMode
  }
]

const baseIframeSrc = computed(() => {
  const url = new URL('/projects/', baseUrl)
  return url.toString()
})

const updatedUrl = computed(() => {
  let url = `${baseIframeSrc.value}${encodeURIComponent(props.projectId)}`
  if (props.modelId) {
    url += `/models/${encodeURIComponent(props.modelId)}`
  }

  if (props.versionId) {
    url += `@${encodeURIComponent(props.versionId)}`
  }

  const enabledOptions = embedDialogOptions
    .filter((option) => option.value.value)
    .map((option) => `"${option.id}":true`)
    .join(',')

  if (enabledOptions) {
    const hashFragment = encodeURIComponent(`{${enabledOptions}}`)
    url += `#embed=${hashFragment}`
  } else {
    url += `#embed=${encodeURIComponent('{"isEnabled":true}')}`
  }

  return url
})

const iframeCode = computed(() => {
  return `<iframe title="Speckle" src="${updatedUrl.value}" width="600" height="400" frameborder="0"></iframe>`
})

const handleEmbedCodeCopy = async (value: string) => {
  await copy(value, {
    successMessage: 'Embed code copied to clipboard',
    failureMessage: 'Failed to copy embed code to clipboard'
  })
}

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
      router.push(`/projects/${props.projectId}?settings=access`)
    }
  }
])
</script>
