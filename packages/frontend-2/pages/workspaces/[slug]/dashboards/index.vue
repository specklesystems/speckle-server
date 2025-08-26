<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink
        :to="dashboardsRoute(activeWorkspaceSlug)"
        name="Dashboards"
        :separator="false"
      />
    </Portal>

    <div class="flex flex-col gap-y-6">
      <section class="flex items-center gap-2 justify-between">
        <h1 class="text-heading-sm md:text-heading">Dashboards</h1>

        <FormButton color="outline" @click="showCreateDashboardDialog = true">
          Add dashboard
        </FormButton>
      </section>

      <DashboardsList />
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
