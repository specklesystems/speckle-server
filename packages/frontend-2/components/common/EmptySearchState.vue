<template>
  <div class="flex flex-col space-y-2 items-center justify-center p-4">
    <img
      src="~~/assets/images/boxes/empty.png"
      alt="No search results found image"
      class="h-32"
    />
    <div class="text-sm">
      <slot>No items matching your search query found!</slot>
    </div>
    <FormButton size="sm" @click="() => $emit('clear-search')">Clear Search</FormButton>
  </div>
</template>
<script setup lang="ts">
defineEmits(['clear-search'])
</script>
