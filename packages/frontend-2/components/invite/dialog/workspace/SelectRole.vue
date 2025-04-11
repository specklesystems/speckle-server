<template>
  <div>
    <FormRadioGroup v-model="selectedRole" size="sm" is-stacked :options="options" />
  </div>
</template>

<script setup lang="ts">
import { Roles, type WorkspaceRoles } from '@speckle/shared'

const props = defineProps<{
  workspaceName: string
}>()

const selectedRole = defineModel<WorkspaceRoles>('selectedRole', { required: true })

const options = computed(() => [
  {
    value: Roles.Workspace.Member,
    title: `Someone who works at ${props.workspaceName}`,
    subtitle:
      'Workspace members can create projects, add others, and act as administrators. Add them if they are full-time, part-time, or volunteers.'
  },
  {
    value: Roles.Workspace.Guest,
    title: 'An external collaborator, contractor, or guest.',
    subtitle:
      "They don't work at Company.com. They can collaborate on projects but can't create projects, invite others, add people, or be admins."
  }
])
</script>
