<template>
  <div
    class="text-foreground hover:text-primary-focus transition last:truncate flex items-center gap-2"
  >
    <div v-if="separator">/</div>
    <NuxtLink
      :to="to"
      class="flex gap-2 items-center text-sm ml-0.5 font-semibold"
      :active-class="showActiveState ? 'text-primary font-bold group is-active' : ''"
    >
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
