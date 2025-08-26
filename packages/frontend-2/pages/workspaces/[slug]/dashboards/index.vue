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

        <FormButton color="outline" @click="createDashboard">Add dashboard</FormButton>
      </section>

      <DashboardsList />
    </div>
  </div>
</template>

<script setup lang="ts">
import { dashboardsRoute } from '~/lib/common/helpers/route'
import { useActiveWorkspaceSlug } from '~/lib/user/composables/activeWorkspace'

const activeWorkspaceSlug = useActiveWorkspaceSlug()

const createDashboard = () => {
  // console.log('createDashboard')
}
</script>
