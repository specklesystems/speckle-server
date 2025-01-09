<template>
  <LayoutSidebarMenuGroup
    title="Security"
    collapsible
    icon="add"
    :icon-click="
      () => navigateTo(settingsRoutes.workspace(workspaceInfo.slug).security)
    "
    icon-text="Add domain"
    no-hover
  >
    <div class="text-body-2xs text-foreground-2 pb-4 mt-1">
      <div class="flex flex-col gap-4">
        Verified domains not set.
        <FormButton
          color="outline"
          size="sm"
          @click="navigateTo(settingsRoutes.workspace(workspaceInfo.slug).security)"
        >
          Improve security
        </FormButton>
      </div>
    </div>
  </LayoutSidebarMenuGroup>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { settingsRoutes } from '~/lib/common/helpers/route'
import type { WorkspaceSidebarSecurity_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment WorkspaceSidebarSecurity_Workspace on Workspace {
    ...WorkspaceSecurity_Workspace
  }
`)

defineProps<{
  workspaceInfo: WorkspaceSidebarSecurity_WorkspaceFragment
}>()
</script>
