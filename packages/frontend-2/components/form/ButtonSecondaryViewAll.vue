<template>
  <div class="w-full flex justify-center">
    <FormButton :to="to" size="sm" color="card" @click="$emit('click', $event)">
      View All
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
