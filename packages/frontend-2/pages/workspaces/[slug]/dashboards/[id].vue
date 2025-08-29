<template>
  <div>
    <Portal to="navigation">
      <div class="flex items-center">
        <HeaderNavLink
          :to="dashboardsRoute(workspace?.slug)"
          name="Dashboard"
          :separator="false"
        />
        <HeaderNavLink
          :to="dashboardRoute(workspace?.slug, id as string)"
          :name="dashboard?.name"
        />
        <FormButton
          v-tippy="'Edit name'"
          size="sm"
          color="subtle"
          class="ml-2"
          hide-text
          :icon-right="Pencil"
          @click="toggleEditDialog"
        />
      </div>
    </Portal>
    <Portal to="primary-actions">
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

    <DashboardsEditDialog v-model:open="editDialogOpen" :dashboard="dashboard" />
  </div>
</template>

<script setup lang="ts">
import { dashboardsRoute, dashboardRoute } from '~/lib/common/helpers/route'
import { dashboardQuery } from '~/lib/dashboards/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'
import { useAuthManager } from '~/lib/auth/composables/auth'
import { Fullscreen, Pencil } from 'lucide-vue-next'
import { useTheme } from '~/lib/core/composables/theme'

graphql(`
  fragment WorkspaceDashboards_Dashboard on Dashboard {
    ...DashboardsEditDialog_Dashboard
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
const { isDarkTheme } = useTheme()

const editDialogOpen = ref(false)

const workspace = computed(() => result.value?.dashboard?.workspace)
const dashboard = computed(() => result.value?.dashboard)
const dashboardUrl = computed(() => {
  return urlToken
    ? `http://127.0.0.1:8083/view/${id}?token=${urlToken}&isEmbed=true&theme=${
        isDarkTheme.value ? 'dark' : 'light'
      }`
    : `http://127.0.0.1:8083/dashboards/${id}?token=${
        effectiveAuthToken.value
      }&isEmbed=true&theme=${isDarkTheme.value ? 'dark' : 'light'}`
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

const toggleEditDialog = () => {
  editDialogOpen.value = !editDialogOpen.value
}
</script>
