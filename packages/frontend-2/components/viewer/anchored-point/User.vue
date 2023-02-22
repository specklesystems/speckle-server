<template>
  <div
    :class="[
      'absolute pointer-events-auto',
      user.isStale ? 'opacity-20 hover:opacity-100' : 'opacity-100',
      user.isOccluded ? 'opacity-90 hover:opacity-100' : 'opacity-100'
    ]"
    :style="{
      ...user.style.target
    }"
  >
    <IconCursor :class="`fill-primary ${user.isOccluded ? 'grayscale' : ''}`" />
    <button
      :class="`relative left-5 -top-0 py-0 px-2 rounded ${
        user.isOccluded ? 'grayscale' : ''
      } bg-primary text-foreground-on-primary hover:bg-primary-focus hover:text-foreground-on-primary transition select-none flex items-center h-6`"
      @click.stop="setUserPow()"
    >
      <span class="text-xs">{{ user.userName }}</span>
    </button>
  </div>
</template>
<script setup lang="ts">
import { UserActivityModel } from '~~/lib/viewer/composables/activity'

defineProps<{
  user: UserActivityModel
}>()

function setUserPow() {
  //TODO
}
</script>
