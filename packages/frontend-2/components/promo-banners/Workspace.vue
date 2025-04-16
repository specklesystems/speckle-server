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
            <FormButton color="subtle" @click="handleDismiss">Dismiss</FormButton>
            <FormButton color="primary" @click="handleReadAnnouncement">
              Read announcement
            </FormButton>
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>
<script setup lang="ts">
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useIsWorkspacesEnabled } from '~/composables/globals'
import { useActiveUserMeta } from '~/lib/user/composables/meta'

const isWorkspacesEnabled = useIsWorkspacesEnabled()
const mixpanel = useMixpanel()
const { hasDismissedNewWorkspaceExplainer, updateNewWorkspaceExplainerDismissed } =
  useActiveUserMeta()

const showBanner = computed(
  () =>
    isWorkspacesEnabled.value &&
    (import.meta.client ? !hasDismissedNewWorkspaceExplainer.value : false)
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

const handleDismiss = async () => {
  await updateNewWorkspaceExplainerDismissed(true)
}

// TODO: Add link to announcement
const handleReadAnnouncement = async () => {
  await navigateTo('https://speckle.systems', {
    external: true,
    open: {
      target: '_blank'
    }
  })
  handleDismiss()
}
</script>
