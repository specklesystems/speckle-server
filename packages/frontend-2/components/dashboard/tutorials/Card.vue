<template>
  <NuxtLink :to="tutorialItem.url" target="_blank" @click="trackClick">
    <div
      class="bg-foundation border border-outline-3 rounded-xl flex flex-col overflow-hidden hover:border-outline-5 transition"
    >
      <NuxtImg
        v-if="tutorialItem.image"
        :src="tutorialItem.image"
        :alt="tutorialItem.title"
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
      <div class="p-5">
        <h3 class="text-body-2xs text-foreground truncate">
          {{ tutorialItem.title }}
        </h3>
      </div>
    </div>
  </NuxtLink>
</template>

<script lang="ts" setup>
import type { TutorialItem } from '~/lib/dashboard/helpers/types'
import { useMixpanel } from '~~/lib/core/composables/mp'

const mixpanel = useMixpanel()

const props = defineProps<{
  tutorialItem: TutorialItem
}>()

const trackClick = () => {
  mixpanel.track('Tutorial clicked', {
    title: props.tutorialItem.title,
    id: props.tutorialItem.id
  })
}
</script>
