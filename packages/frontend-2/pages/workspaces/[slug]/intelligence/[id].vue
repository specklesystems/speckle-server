<template>
  <div>
    <Portal to="header-left">
      <div class="flex items-center gap-2">
        <WorkspaceAvatar
          :name="workspace?.name || 'Personal projects'"
          :logo="workspace?.logo"
        />
        <p class="text-body-xs text-foreground truncate max-w-40">
          {{ workspace?.name }}
        </p>
      </div>
    </Portal>
    <Portal to="header-center">
      <div class="flex items-center">
        <HeaderNavLink
          :to="dashboardsRoute(workspace?.slug)"
          name="Intelligence"
          :separator="false"
        />
        <HeaderNavLink
          :to="dashboardRoute(workspace?.slug, id as string)"
          :name="dashboard?.name"
        />
      </div>
    </Portal>
    <Portal to="header-right">
      <div class="flex items-center gap-2">
        <DashboardsShare :id="dashboard?.id" />
        <FormButton
          v-tippy="'Toggle fullscreen'"
          size="sm"
          color="outline"
          :icon-right="Fullscreen"
          hide-text
          @click="toggleFullScreen()"
        >
          Fullscreen
        </FormButton>
      </div>
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
import { Fullscreen } from 'lucide-vue-next'

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
      logo
    }
  }
`)

definePageMeta({
  layout: 'dashboard'
})

const { id } = useRoute().params
const { token: urlToken } = useRoute().query
const { result } = useQuery(dashboardQuery, () => ({ id: id as string }))
const { effectiveAuthToken } = useAuthManager()
const logger = useLogger()

const workspace = computed(() => result.value?.dashboard?.workspace)
const dashboard = computed(() => result.value?.dashboard)

const dashboardUrl = computed(() => {
  return urlToken
    ? `http://localhost:8083/view/${id}?token=${urlToken}&isEmbed=true`
    : `http://localhost:8083/dashboards/${id}?token=${effectiveAuthToken.value}&isEmbed=true`
})

const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      logger.warn(`Error attempting to enable fullscreen: ${err.message}`)
    })
  } else {
    document.exitFullscreen().catch((err) => {
      logger.warn(`Error attempting to exit fullscreen: ${err.message}`)
    })
  }
}
</script>
