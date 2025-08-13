<template>
  <div class="flex">
    <div v-if="!hideVersions" v-tippy="'Versions'" class="flex">
      <FormButton
        icon-left="IconVersions"
        hide-text
        size="sm"
        color="subtle"
        @click="$emit('showVersions')"
      >
        Versions
      </FormButton>
    </div>
    <div v-tippy="'Add model'" class="flex">
      <FormButton
        icon-left="IconPlus"
        hide-text
        size="sm"
        color="subtle"
        @click="$emit('addModel')"
      >
        Add model
      </FormButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FormButton } from '@speckle/ui-components'

defineProps<{
  hideVersions?: boolean
}>()

defineEmits<{
  showVersions: []
  addModel: []
}>()
</script>
