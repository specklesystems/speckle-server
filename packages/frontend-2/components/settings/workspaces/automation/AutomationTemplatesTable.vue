<template>
  <div>Hey</div>
</template>

<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import type { SettingsWorkspacesAutomationAutomationTemplatesTable_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment SettingsWorkspacesAutomationAutomationTemplatesTable_Workspace on Workspace {
    id
    automationTemplates {
      id
      name
      functionId
      functionRevisionId
    }
  }
`)

const props = defineProps<{
  templates: SettingsWorkspacesAutomationAutomationTemplatesTable_WorkspaceFragment['automationTemplates']
}>()
</script>
