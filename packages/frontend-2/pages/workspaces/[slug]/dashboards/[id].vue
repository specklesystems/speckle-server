<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink
        :to="dashboardsRoute(workspace?.slug)"
        name="Dashboards"
        :separator="false"
      />
      <HeaderNavLink
        :to="dashboardRoute(workspace?.slug, id as string)"
        :name="dashboard?.name"
      />
    </Portal>
    <div class="w-screen h-screen">
      <iframe
        :src="dashboardUrl"
        class="w-full h-full border-0"
        frameborder="0"
        :title="dashboard?.name"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { dashboardsRoute, dashboardRoute } from '~/lib/common/helpers/route'
import { dashboardQuery } from '~/lib/dashboards/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'
import { useAuthManager } from '~/lib/auth/composables/auth'

graphql(`
  fragment WorkspaceDashboards_Dashboard on Dashboard {
    id
    name
    createdBy {
      id
      name
      avatar
    }
    createdAt
    updatedAt
    workspace {
      id
      name
      slug
    }
  }
`)

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard'
})

const { id } = useRoute().params
const { result } = useQuery(dashboardQuery, () => ({ id: id as string }))
const { effectiveAuthToken } = useAuthManager()
const workspace = computed(() => result.value?.dashboard?.workspace)
const dashboard = computed(() => result.value?.dashboard)

const dashboardUrl = computed(() => {
  return `http://localhost:8083/dashboards/${id}?token=${effectiveAuthToken.value}&isEmbed=true`
})
</script>
