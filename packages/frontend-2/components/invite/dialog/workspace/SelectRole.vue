<template>
  <div>
    <FormRadioGroup v-model="selectedRole" size="sm" is-stacked :options="options" />
  </div>
</template>

<script setup lang="ts">
import { Roles, type WorkspaceRoles } from '@speckle/shared'

const selectedRole = defineModel<WorkspaceRoles>('selectedRole', { required: true })

const options = computed(() => [
  {
    value: Roles.Workspace.Member,
    title: `Someone from my company or organization`,
    subtitle:
      'They will be invited as a workspace member with default view access on all projects.'
  },
  {
    value: Roles.Workspace.Guest,
    title: 'An external collaborator',
    subtitle:
      "They will be invited as a workspace guest with access only to the specific projects they're added to."
  }
])
</script>
