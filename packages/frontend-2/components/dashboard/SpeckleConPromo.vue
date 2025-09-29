<template>
  <CommonCard class="relative !px-2 !py-2.5 bg-foundation shadow-sm">
    <FormButton
      class="absolute top-1 right-1"
      size="sm"
      color="subtle"
      :icon-right="XMarkIcon"
      hide-text
      @click="dismissBanner"
    >
      <span class="sr-only">Close</span>
    </FormButton>
    <div class="flex flex-col gap-y-2 text-foreground">
      <span class="text-[10px] font-mono uppercase tracking-widest">
        Upcoming event
      </span>
      <h3 class="text-body-xs font-semibold leading-tight tracking-tight">
        See how the best do it
      </h3>
      <p class="text-body-3xs leading-tight">
        Join global AEC leaders at SpeckleCon in London, Nov 7th.
      </p>
      <NuxtLink
        to="https://conf.speckle.systems/"
        target="_blank"
        external
        class="flex gap-1 items-center border-b border-transparent hover:border-highlight-3 max-w-max -mb-0.5"
        @click="onCTAClick"
      >
        <span class="text-body-3xs font-semibold">Get tickets</span>
        <ArrowUpRightIcon class="h-2 w-2 mt-px stroke-2 stroke-foreground" />
      </NuxtLink>
    </div>
  </CommonCard>
</template>

<script setup lang="ts">
import { ArrowUpRightIcon, XMarkIcon } from '@heroicons/vue/24/solid'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useActiveUserMeta } from '~~/lib/user/composables/meta'

const mixpanel = useMixpanel()
const { updateSpeckleCon25BannerDismissed } = useActiveUserMeta()

const onCTAClick = () => {
  mixpanel.track('SpeckleCon 2025 CTA Clicked')
}

const dismissBanner = async () => {
  await updateSpeckleCon25BannerDismissed(true)
}

onMounted(() => {
  mixpanel.track('SpeckleCon 2025 Banner Shown')
})
</script>
