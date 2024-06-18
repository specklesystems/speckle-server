<template>
  <div>
    <CommonEditableTitle v-model="title" :disabled="disabled" />
    <CommonEditableDescription v-model="description" :disabled="disabled" />
  </div>
</template>
<script setup lang="ts">
defineProps<{
  disabled?: boolean
}>()

const description = defineModel<string>('description', { required: true })
const title = defineModel<string>('title', { required: true })
</script>
