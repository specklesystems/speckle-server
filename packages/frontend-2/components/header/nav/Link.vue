<template>
  <div
    class="text-foreground hover:text-primary-focus transition truncate flex gap-1 items-center ml-1"
  >
    <div v-if="separator">
      <svg
        width="8"
        height="24"
        viewBox="0 0 8 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="text-outline-5"
      >
        <path d="M2 18L6 6" stroke="currentColor" />
      </svg>
    </div>
    <NuxtLink
      :to="disableLink ? undefined : to"
      class="flex gap-1 items-center text-body-xs ml-0.5 text-foreground-2 select-none truncate"
      :class="disableLink ? '' : 'hover:!text-foreground'"
      active-class="group is-active !text-foreground font-medium"
    >
      <div class="truncate">
        {{ name || to }}
      </div>
      <!-- Chevron to return in future -->
      <!-- <ChevronDownIcon v-if="!hideChevron" class="h-2.5 w-2.5" /> -->
    </NuxtLink>
  </div>
</template>
<script setup lang="ts">
defineProps({
  separator: {
    type: Boolean,
    default: true
  },
  hideChevron: {
    type: Boolean,
    default: false
  },
  to: {
    type: String,
    default: '/'
  },
  name: {
    type: String,
    default: null
  },
  disableLink: {
    type: Boolean,
    default: false
  }
})
</script>
