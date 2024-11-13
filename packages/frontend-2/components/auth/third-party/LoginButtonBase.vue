<template>
  <NuxtLink :to="to">
    <div
      class="group inline-flex justify-center items-center text-center select-none whitespace-nowrap outline outline-2 outline-transparent transition duration-200 ease-in-out focus-visible:outline-outline-4 rounded-md border w-full h-10 text-body-sm bg-foundation border-outline-2 text-foreground font-medium hover:bg-primary-muted disabled:hover:bg-foundation focus-visible:border-foundation px-6 py-2"
    >
      <slot />
    </div>
  </NuxtLink>
</template>
<script setup lang="ts">
defineProps<{
  to: string
}>()
</script>
