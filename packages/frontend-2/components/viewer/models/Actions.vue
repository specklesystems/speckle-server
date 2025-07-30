<template>
  <div class="flex pr-1">
    <div v-tippy="'Versions'" class="flex">
      <button
        class="group-hover:opacity-100 hover:bg-highlight-3 rounded-md h-6 w-6 flex items-center justify-center shrink-0"
        @click="$emit('showVersions')"
      >
        <IconVersions class="w-4 h-4" />
        <span class="sr-only">Versions</span>
      </button>
    </div>
    <div v-tippy="'Add model'" class="flex">
      <button
        class="group-hover:opacity-100 hover:bg-highlight-3 rounded-md h-6 w-6 flex items-center justify-center shrink-0"
        @click="$emit('addModel')"
      >
        <IconPlus class="w-4 h-4" />
        <span class="sr-only">Add model</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  showVersions: []
  addModel: []
}>()

const IconPlus = resolveComponent('IconPlus')
const IconVersions = resolveComponent('IconVersions')
</script>
