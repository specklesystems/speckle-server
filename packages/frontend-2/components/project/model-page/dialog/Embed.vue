<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="md"
    :buttons="
      props.visibility == projectVisibility.Private
        ? nonDiscoverableButtons
        : discoverableButtons
    "
  >
    <template #header>Embed Model</template>
    <div v-if="props.visibility === projectVisibility.Private">
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
      <h4 class="font-bold text-sm text-foreground-2 mb-2 ml-0.5">Code</h4>
      <FormClipboardInput :value="iframeCode" is-multiline />
      <p class="text-foreground-2 mt-2 mb-5 ml-0.5">
        Copy this code to embed an iframe of model in your webpage or document.
      </p>
      <LayoutDialogSection border-b border-t title="Embed Options">
        <template #icon>
          <Cog6ToothIcon class="h-full w-full" />
        </template>
        <div class="flex flex-col gap-3 ml-7 text-sm cursor-default">
          <div
            v-for="option in embedOptions"
            :key="option.id"
            class="flex items-center justify-between"
          >
            <label :for="`option-${option.id}`">{{ option.label }}</label>
            <FormCheckbox
              :id="`option-${option.id}`"
              :model-value="option.value.value"
              :name="option.label"
              hide-label
              @update:model-value="(newValue) => updateOption(option.value, newValue)"
            />
          </div>
        </div>
      </LayoutDialogSection>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Cog6ToothIcon } from '@heroicons/vue/24/outline'
import { ProjectVisibility } from '~/lib/common/generated/gql/graphql'
import { useClipboard } from '~~/composables/browser'

const props = defineProps<{
  projectId: string
  modelId: string
  versionId?: string
  visibility: ProjectVisibility
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const router = useRouter()
const { copy } = useClipboard()

const projectVisibility = ref(ProjectVisibility)

const transparentBackground = ref(false)
const hideViewerControls = ref(false)
const hideSelectionInfo = ref(false)
const preventScrolling = ref(false)
const autoLoadModel = ref(false)
const commentSlideshowMode = ref(false)

const updateOption = (optionRef: Ref<boolean>, newValue: unknown) => {
  optionRef.value = newValue === undefined ? false : !!newValue
}

const embedOptions = [
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
    id: 'autoload',
    label: 'Load model automatically',
    value: autoLoadModel
  },
  {
    id: 'commentSlideshow',
    label: 'Comment slideshow mode',
    value: commentSlideshowMode
  }
]

const baseIframeSrc = 'http://localhost:8081/projects/'

const updatedUrl = computed(() => {
  let url = `${baseIframeSrc}${props.projectId}`
  if (props.modelId) {
    url += `/models/${props.modelId}`
  }

  if (props.versionId) {
    url += `%40${props.versionId}`
  }

  const enabledOptions = embedOptions
    .filter((option) => option.value.value)
    .map((option) => `%22${option.id}%22:true`)
    .join(',')

  if (enabledOptions) {
    url += `#embed={${enabledOptions}}`
  }

  return url
})

const iframeCode = computed(() => {
  return `<iframe src="${updatedUrl.value}" width="800" height="540" frameborder="0"></iframe>`
})

const handleShareableLinkCopy = async (value: string) => {
  await copy(value, {
    successMessage: 'Value copied to clipboard',
    failureMessage: 'Failed to copy value to clipboard'
  })
}

const handleEmbedCodeCopy = async (value: string) => {
  await copy(value, {
    successMessage: 'Value copied to clipboard',
    failureMessage: 'Failed to copy value to clipboard'
  })
}

const discoverableButtons = computed(() => [
  {
    text: 'Copy Shareable Link',
    props: { color: 'invert', fullWidth: true, outline: true },
    onClick: () => {
      handleShareableLinkCopy(updatedUrl.value)
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
      router.push(`/projects/${props.projectId}?settings=access`)
    }
  }
])
</script>
