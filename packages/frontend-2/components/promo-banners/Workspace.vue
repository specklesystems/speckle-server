<template>
  <ClientOnly>
    <div class="position left-2 sm:left-auto right-2 bottom-2 fixed z-[45]">
      <div
        v-if="showBanner"
        class="rounded-lg flex flex-col w-full sm:max-w-96 border border-outline-2 shadow-md bg-foundation-3 dark:bg-foundation"
      >
        <img
          src="/images/workspace/announcement-dark.png"
          class="hidden dark:block w-full"
          alt="Try workspaces"
        />
        <img
          src="/images/workspace/announcement-light.png"
          class="dark:hidden w-full"
          alt="Try workspaces"
        />
        <div class="px-5 py-6 flex flex-col gap-y-2">
          <h5 class="text-body-xs md:text-heading-sm text-foreground font-medium">
            Free plan limits and workspaces announcement
          </h5>
          <p class="text-body-2xs leading-5 md:text-body-xs text-foreground-2">
            We've made big changes to how you work in Speckle. New navigation, new
            limits and pricing, and workspaces are now the default.
          </p>
          <div class="flex items-center gap-x-2 mt-2 justify-end">
            <FormButton color="subtle" @click="dismissedCookie = true">
              Dismiss
            </FormButton>
            <!-- TODO: Add link to announcement -->
            <FormButton color="primary">Read announcement</FormButton>
          </div>
        </div>
        <WorkspaceCreateDialog
          v-model:open="showWorkspaceCreateDialog"
          navigate-on-success
          event-source="promo-banner"
          @created="dismissedCookie = true"
        />
      </div>
    </div>
  </ClientOnly>
</template>
<script setup lang="ts">
// This is a temporary component, to meassure if in app-notifications can be succesful
// It will be remove after a certain period, if we continue with in-app notification we should further develop this

import { useMixpanel } from '~~/lib/core/composables/mp'
import { useIsWorkspacesEnabled } from '~/composables/globals'

const isWorkspacesEnabled = useIsWorkspacesEnabled()
const mixpanel = useMixpanel()

// TODO: Use boolean froms server
const dismissedCookie = ref(false)

const showWorkspaceCreateDialog = ref(false)

const showBanner = computed(
  () =>
    isWorkspacesEnabled.value && (import.meta.client ? !dismissedCookie.value : false)
)

watch(
  showBanner,
  (newVal) => {
    if (newVal) {
      mixpanel.track('Workspace Limit Announcement Banner Viewed', {
        source: 'promo-banner'
      })
    }
  },
  { immediate: true }
)
</script>
