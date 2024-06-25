<template>
  <div
    class="text-foreground hover:text-primary-focus transition last:truncate flex items-center gap-2"
  >
    <div v-if="separator">/</div>
    <NuxtLink
      :to="to"
      class="flex gap-1 items-center text-sm ml-0.5"
      active-class="text-primary font-semibold group is-active"
    >
      <div v-if="separator">
        <ChevronRightIcon class="flex w-4 h-4 text-foreground-2" />
      </div>
      <div class="group-[.is-active]:truncate">
        {{ name || to }}
      </div>
    </NuxtLink>
  </div>
</template>
<script setup lang="ts">
defineProps({
  separator: {
    type: Boolean,
    default: true
  },
  to: {
    type: String,
    default: '/'
  },
  name: {
    type: String,
    default: null
  },
  showActiveState: {
    type: Boolean,
    default: true
  }
})
</script>
