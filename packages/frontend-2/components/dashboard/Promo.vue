<template>
  <CommonCard class="relative !px-3 !py-2.5 bg-foundation shadow-sm">
    <div class="flex flex-col gap-y-2 text-foreground">
      <span class="text-[10px] font-mono uppercase tracking-widest">
        Upcoming Event
      </span>
      <h3 class="text-body-xs font-semibold leading-tight tracking-tight">
        SpeckleCON:
        <br />
        Too useful to ignore
      </h3>
      <p class="text-body-3xs leading-tight">
        Join us! 7 Nov, 2025
        <br />
        London, UK
      </p>
      <NuxtLink
        to="https://conf.speckle.systems/"
        target="_blank"
        external
        class="flex gap-1 items-center border-b border-transparent hover:border-highlight-3 max-w-max -mb-0.5"
        @click="onCTAClick"
      >
        <span class="text-body-3xs font-semibold">Learn more</span>
        <ArrowUpRightIcon class="h-2 w-2 mt-px stroke-2 stroke-foreground" />
      </NuxtLink>
    </div>
  </CommonCard>
</template>
<script setup lang="ts">
import { ArrowUpRightIcon } from '@heroicons/vue/24/solid'
import { useMixpanel } from '~~/lib/core/composables/mp'

const mixpanel = useMixpanel()

const onCTAClick = () => {
  mixpanel.track('SpeckleCON CTA Clicked', {
    location: 'sidebar'
  })
}
</script>
