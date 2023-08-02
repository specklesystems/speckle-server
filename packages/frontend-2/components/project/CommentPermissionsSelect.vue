<template>
  <FormSelectBase
    v-model="selectValue"
    :items="Object.values(items)"
    label="Commenting permissions"
    :show-label="showLabel"
    :name="name || 'commentPermissions'"
    :allow-unset="false"
    :disabled="disabled"
    by="id"
  >
    <template #something-selected="{ value }">
      <div class="label label--light">
        {{ value.title }}
      </div>
    </template>
    <template #option="{ item, selected }">
      <div class="flex flex-col">
        <div :class="['label label--light', selected ? 'text-primary' : '']">
          {{ item.title }}
        </div>
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import {
  CommentPermissions,
  commentPermissionsSelectItems
} from '~~/lib/projects/helpers/components'

const emit = defineEmits<{
  (e: 'update:modelValue', v: CommentPermissions): void
}>()

const props = defineProps<{
  modelValue: CommentPermissions
  showLabel?: boolean
  name?: string
  disabled?: boolean
}>()

const items = ref(commentPermissionsSelectItems)

const selectedValue = computed({
  get: () => props.modelValue,
  set: (newVal) => emit('update:modelValue', newVal)
})

const selectValue = computed({
  get: () => items.value[selectedValue.value],
  set: (newVal) => (selectedValue.value = newVal.id)
})
</script>
