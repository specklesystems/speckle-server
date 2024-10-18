<template>
  <NuxtLink :to="webflowItem.url" target="_blank">
    <div
      class="bg-foundation border border-outline-3 rounded-xl flex flex-col overflow-hidden hover:border-outline-5 transition"
    >
      <NuxtImg
        v-if="webflowItem.featureImageUrl"
        :src="webflowItem.featureImageUrl"
        :alt="webflowItem.title"
        class="h-32 w-full object-cover"
        width="400"
        height="225"
      />
      <div
        v-else
        class="bg-foundation-page w-full h-32 flex items-center justify-center"
      >
        <HeaderLogoBlock no-link minimal class="scale-150" />
      </div>
      <div class="p-5 pb-4">
        <h3 class="text-body-2xs text-foreground truncate">
          {{ webflowItem.title }}
        </h3>
        <p class="text-body-3xs text-foreground-2 mt-2">
          <span v-tippy="createdOn.full">
            {{ createdOn.relative }}
          </span>
          <template v-if="webflowItem.readTime">
            <span class="pl-1 pr-2">•</span>
            {{ webflowItem.readTime }}m read
          </template>
        </p>
      </div>
    </div>
  </NuxtLink>
</template>

<script lang="ts" setup>
import type { WebflowItem } from '~/lib/dashboard/helpers/types'

const props = defineProps<{
  webflowItem: WebflowItem
}>()

const createdOn = computed(() => ({
  full: formattedFullDate(props.webflowItem.createdOn),
  relative: formattedRelativeDate(props.webflowItem.createdOn, { capitalize: true })
}))
</script>
