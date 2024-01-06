<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="md"
    :buttons="[
      {
        text: 'Cancel',
        props: { color: 'invert', fullWidth: true },
        onClick: () => (isOpen = false)
      },
      {
        text: 'Copy',
        props: { color: 'primary', fullWidth: true }
      }
    ]"
  >
    <template #header>Embed Model</template>
    <h4 class="font-bold text-sm text-foreground-2 mb-2 ml-0.5">Code</h4>
    <FormClipboardInput :value="updatedUrl" is-multiline />
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
  </LayoutDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Cog6ToothIcon } from '@heroicons/vue/24/outline'

const isOpen = ref(false)

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
    id: 'transparent',
    label: 'Transparent background',
    value: transparentBackground
  },
  {
    id: 'hidecontrols',
    label: 'Hide viewer controls',
    value: hideViewerControls
  },
  {
    id: 'hideselectioninfo',
    label: 'Hide the Selection Info panel',
    value: hideSelectionInfo
  },
  {
    id: 'noscroll',
    label: 'Prevent scrolling (zooming)',
    value: preventScrolling
  },
  {
    id: 'autoload',
    label: 'Load model automatically',
    value: autoLoadModel
  },
  {
    id: 'commentslideshow',
    label: 'Comment slideshow mode',
    value: commentSlideshowMode
  }
]

const baseIframeSrc = 'https://speckle.xyz/embed?stream=1751299028&commit=347bbd734c'

const updatedUrl = computed(() => {
  let url = baseIframeSrc
  embedOptions.forEach((option) => {
    if (option.value.value) {
      url += `&${option.id}=true`
    }
  })
  return `<iframe src="${url}" width="600" height="400" frameborder="0"></iframe>`
})
</script>
