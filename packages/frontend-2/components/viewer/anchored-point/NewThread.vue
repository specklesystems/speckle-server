<template>
  <div
    v-show="model.isVisible"
    class="absolute pointer-events-auto"
    :style="{
      ...model.style
    }"
  >
    <FormButton :icon-left="PlusIcon" hide-text />
  </div>
</template>
<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/24/solid'
import { ViewerNewThreadBubbleModel } from '~~/lib/viewer/composables/commentBubbles'

defineProps<{
  model: ViewerNewThreadBubbleModel
}>()
</script>
