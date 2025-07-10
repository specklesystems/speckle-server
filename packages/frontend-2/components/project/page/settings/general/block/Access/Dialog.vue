<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Confirm visibility change"
    max-width="sm"
    :buttons="dialogButtons"
  >
    <div class="text-body-xs">
      <p class="text-foreground">
        You're about to change the visibility of this project from
        <span class="font-medium">Public</span>
        to
        <span class="font-medium">{{ newVisibilityLabel }}.</span>
      </p>

      <div class="mt-4">
        <p class="mb-1">
          Existing project embeds will still have access to project data. Do you want to
          disable them?
        </p>
        <FormCheckbox
          v-model="revokeEmbedTokens"
          label="Disable existing embeds"
          name="revoke-embed-tokens"
        />
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import {
  SupportedProjectVisibility,
  castToSupportedVisibility
} from '~/lib/projects/helpers/visibility'
import { useDeleteAllEmbedTokens } from '~/lib/projects/composables/tokenManagement'

const emit = defineEmits(['confirm', 'cancel'])

const props = defineProps<{
  currentVisibility?: SupportedProjectVisibility
  newVisibility?: SupportedProjectVisibility | null
  projectId: string
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const deleteAllEmbedTokens = useDeleteAllEmbedTokens()
const logger = useLogger()

const revokeEmbedTokens = ref(false)

const newVisibilityLabel = computed(() => {
  if (!props.newVisibility) return ''

  const visibility = castToSupportedVisibility(props.newVisibility)
  switch (visibility) {
    case SupportedProjectVisibility.Workspace:
      return 'Workspace'
    case SupportedProjectVisibility.Private:
      return 'Private'
    default:
      return 'Private'
  }
})

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
      emit('cancel')
    }
  },
  {
    text: 'Confirm',
    onClick: onConfirm
  }
])

const onConfirm = async () => {
  if (revokeEmbedTokens.value) {
    try {
      await deleteAllEmbedTokens({ projectId: props.projectId })
    } catch (error) {
      logger.error('Failed to delete all embed tokens', error)
    }
  }

  emit('confirm')
}
</script>
