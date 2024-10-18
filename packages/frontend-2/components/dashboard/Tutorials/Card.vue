<template>
  <NuxtLink :to="tutorial.url" target="_blank">
    <div
      class="bg-foundation border border-outline-3 rounded-xl flex flex-col overflow-hidden hover:border-outline-5 transition"
    >
      <div
        v-if="tutorial.featureImageUrl"
        :style="{ backgroundImage: `url(${tutorial.featureImageUrl})` }"
        class="bg-foundation-page bg-cover bg-center w-full h-32"
      />
      <div
        v-else
        class="bg-foundation-page w-full h-32 flex items-center justify-center"
      >
        <HeaderLogoBlock no-link minimal class="scale-150" />
      </div>
      <div class="p-5 pb-4">
        <h3 v-if="tutorial.title" class="text-body-2xs text-foreground truncate">
          {{ tutorial.title }}
        </h3>
        <p class="text-body-3xs text-foreground-2 mt-2">
          <span v-tippy="createdOn.full">
            {{ createdOn.relative }}
          </span>
          <template v-if="tutorial.readTime">
            <span class="pl-1 pr-2">•</span>
            {{ tutorial.readTime }}m read
          </template>
        </p>
      </div>
    </div>
  </NuxtLink>
</template>

<script lang="ts" setup>
import type { TutorialItem } from '~/lib/dashboard/helpers/types'

const props = defineProps<{
  tutorial: TutorialItem
}>()

const createdOn = computed(() => ({
  full: formattedFullDate(props.tutorial.createdOn),
  relative: formattedRelativeDate(props.tutorial.createdOn, { capitalize: true })
}))
</script>
