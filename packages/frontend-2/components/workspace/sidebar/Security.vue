<template>
  <div class="px-4 py-2">
    <LayoutSidebarMenuGroup
      title="Security"
      collapsible
      icon="add"
      :icon-click="
        () => navigateTo(settingsWorkspaceRoutes.security.route(workspace?.slug || ''))
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
            @click="
              navigateTo(settingsWorkspaceRoutes.security.route(workspace?.slug || ''))
            "
          >
            Improve security
          </FormButton>
        </div>
      </div>
    </LayoutSidebarMenuGroup>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { settingsWorkspaceRoutes } from '~/lib/common/helpers/route'
import type { WorkspaceSidebarSecurity_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import type { MaybeNullOrUndefined } from '@speckle/shared'

graphql(`
  fragment WorkspaceSidebarSecurity_Workspace on Workspace {
    id
    slug
    domains {
      id
      domain
    }
  }
`)

defineProps<{
  workspace: MaybeNullOrUndefined<WorkspaceSidebarSecurity_WorkspaceFragment>
}>()
</script>
