<template>
  <FormButton
    color="outline"
    size="lg"
    full-width
    class="group"
    :to="to"
    :external="true"
    :link-component="'a'"
  >
    <div class="flex items-center justify-center">
      <slot />
    </div>
  </FormButton>
</template>

<script setup lang="ts">
defineProps<{
  to: string
}>()
</script>
