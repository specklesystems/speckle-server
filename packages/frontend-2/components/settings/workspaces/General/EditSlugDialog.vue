<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Edit workspace short ID"
    max-width="sm"
    :buttons="dialogButtons"
  >
    <p class="text-body-xs text-foreground mb-4">
      Changing the workspace short ID has important implications:
    </p>
    <ul class="list-disc list-inside text-body-xs text-foreground mb-4">
      <li>All links generated using the old short ID will become invalid</li>
      <li>This may break bookmarks, embeds, or previously shared links</li>
    </ul>
    <p class="text-body-xs text-foreground font-medium mb-4">
      Are you sure you want to proceed?
    </p>
    <FormTextInput
      v-model:model-value="newSlug"
      name="newSlug"
      label="Short ID"
      :help="getSlugHelp"
      color="foundation"
      :rules="[
        isRequired,
        isStringOfLength({ maxLength: 50, minLength: 3 }),
        isValidWorkspaceSlug
      ]"
      show-label
      @update:model-value="onSlugInput"
    />
  </LayoutDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { LayoutDialogButton } from '@speckle/ui-components'
import {
  isRequired,
  isStringOfLength,
  isValidWorkspaceSlug
} from '~~/lib/common/helpers/validation'

const props = defineProps<{
  workspace: {
    id: string
    name: string
    slug: string
  }
}>()

const isOpen = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{
  (e: 'update:slug', newSlug: string): void
}>()

const newSlug = ref(props.workspace.slug)
const baseUrl = useRuntimeConfig().public.baseUrl

const getSlugHelp = computed(() => {
  return `${baseUrl}/workspaces/${newSlug.value}`
})

const onSlugInput = (value: string) => {
  newSlug.value = value
}

const updateSlug = () => {
  emit('update:slug', newSlug.value)
  isOpen.value = false
}

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Update',
    props: {
      color: 'primary',
      disabled: newSlug.value === props.workspace.slug || !newSlug.value.trim()
    },
    onClick: updateSlug
  }
])
</script>
