<template>
  <NuxtLink v-if="tutorial.url" :to="tutorial.url" external>
    <div
      class="bg-foundation border border-1 border-outline-3 rounded-xl flex flex-col overflow-hidden hover:border-outline-5 transition"
    >
      <div
        :style="{ backgroundImage: `url(${tutorial.featureImage})` }"
        class="bg-foundation-page bg-cover bg-center w-full h-32"
      />
      <div class="p-5 pb-4">
        <h3 v-if="tutorial.title" class="text-body-2xs text-foreground truncate">
          {{ tutorial.title }}
        </h3>
        <p class="text-body-3xs text-foreground-2 capitalize mt-2">
          <span v-tippy="updatedAt.full">
            {{ updatedAt.relative }}
          </span>
          <template v-if="tutorial.readingTime">
            <span class="pl-1 pr-2">•</span>
            {{ tutorial.readingTime }}m read
          </template>
        </p>
      </div>
    </div>
  </NuxtLink>
</template>

<script lang="ts" setup>
import type { TutorialCard } from '~~/lib/dashboard/helpers/types'

const props = defineProps<{
  tutorial: TutorialCard
}>()

const updatedAt = computed(() => {
  return {
    full: formattedFullDate(props.tutorial.publishedAt),
    relative: formattedRelativeDate(props.tutorial.publishedAt, { capitalize: true })
  }
})
</script>
