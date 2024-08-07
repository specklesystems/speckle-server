<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Add domain"
    max-width="sm"
    :buttons="dialogButtons"
  >
    <FormSelectWorkspaceDomains
      :domains="verifiedUserDomains"
      :model-value="selectedDomain"
      @update:model-value="onSelectedDomainUpdate"
    />
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { graphql } from '~~/lib/common/generated/gql'

graphql(`
  fragment SettingsWorkspaceSecurityAdd_Workspace on Workspace {
    id
  }
`)

defineProps<{
  verifiedUserDomains: string[]
  workspace: SettingsWorkspaceSecurityAdd_WorkspaceFragment
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const selectedDomain = ref<string>()
const onSelectedDomainUpdate = (e?: string | string[]) => {
  if (typeof e !== 'string') {
    return
  }
  selectedDomain.value = e
}

const onAdd = async () => {
  console.log(selectedDomain.value)
}

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline', fullWidth: true },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Add',
    props: {
      fullWidth: true,
      color: 'primary'
    },
    onClick: onAdd
  }
])
</script>
