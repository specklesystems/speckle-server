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
    <div
      v-tippy="removeEnabled ? 'Remove model' : 'You cannot remove the last model'"
      class="flex"
    >
      <FormButton
        color="subtle"
        :disabled="!removeEnabled"
        :icon-left="IconMinus"
        hide-text
        @click="$emit('remove')"
      >
        {{ showRemove ? 'Done' : 'Remove' }}
      </FormButton>
    </div>
    <div v-tippy="'Add model'" class="flex">
      <FormButton
        color="subtle"
        :disabled="showRemove"
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
interface Props {
  removeEnabled: boolean
  showRemove: boolean
}

defineProps<Props>()

defineEmits<{
  showVersions: []
  remove: []
  addModel: []
}>()

const IconPlus = resolveComponent('IconPlus')
const IconVersions = resolveComponent('IconVersions')
const IconMinus = resolveComponent('IconMinus')
</script>
