<template>
  <div
    :class="[
      'absolute pointer-events-auto',
      user.isStale ? 'opacity-20 hover:opacity-100' : 'opacity-100',
      user.isOccluded ? 'opacity-60 hover:opacity-100' : 'opacity-100'
    ]"
    :style="{
      ...user.style.target
    }"
  >
    <IconCursor class="fill-primary" />
    <button
      class="relative left-3 -top-3 py-0 px-2 rounded-xl text-tiny bg-primary text-foreground-on-primary hover:bg-primary-focus transition select-none"
      @click.stop="setUserPow()"
    >
      <span>{{ user.userName }}</span>
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
