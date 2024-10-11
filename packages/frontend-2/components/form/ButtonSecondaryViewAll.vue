<template>
  <div class="w-full flex justify-center">
    <FormButton :to="to" color="outline" @click="$emit('click', $event)">
      View all
    </FormButton>
  </div>
</template>
<script setup lang="ts">
defineEmits<{
  click: [MouseEvent]
}>()

defineProps<{
  to?: string
}>()
</script>
