<template>
  <div class="flex pr-1">
    <div v-tippy="'Versions'" class="flex">
      <FormButton
        color="subtle"
        :icon-left="IconVersions"
        hide-text
        @click="$emit('showVersions')"
      >
        Versions
      </FormButton>
    </div>
    <div v-tippy="'Add model'" class="flex">
      <FormButton
        color="subtle"
        hide-text
        :icon-left="IconPlus"
        @click="$emit('addModel')"
      >
        Add model
      </FormButton>
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
