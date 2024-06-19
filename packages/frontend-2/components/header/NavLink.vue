<template>
  <div class="text-foreground hover:text-primary-focus transition last:truncate">
    <NuxtLink :to="to" class="flex gap-1 items-center text-sm ml-0.5 font-semibold">
      <div v-if="separator">/</div>
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
  }
})
</script>
