<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink
        :to="dashboardsRoute(activeWorkspaceSlug)"
        name="Intelligence"
        :separator="false"
      />
    </Portal>

    <div>
      <DashboardsList :workspace-slug="activeWorkspaceSlug" />
    </div>

    <DashboardsCreateDialog
      v-model:open="showCreateDashboardDialog"
      :workspace-slug="activeWorkspaceSlug"
    />
  </div>
</template>

<script setup lang="ts">
import { dashboardsRoute } from '~/lib/common/helpers/route'
import { useActiveWorkspaceSlug } from '~/lib/user/composables/activeWorkspace'

const activeWorkspaceSlug = useActiveWorkspaceSlug()

const showCreateDashboardDialog = ref(false)
</script>
