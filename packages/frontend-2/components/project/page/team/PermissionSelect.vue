<template>
  <FormSelectBase
    v-model="selectValue"
    :items="Object.values(items)"
    label="Project access level"
    button-style="simple"
    :show-label="showLabel"
    :name="name || 'role'"
    :allow-unset="false"
    hide-checkmarks
    by="id"
    class="min-w-[85px]"
  >
    <template #something-selected="{ value }">
      <div class="text-normal">
        {{ value.title }}
      </div>
    </template>
    <template #option="{ item, selected }">
      <div class="flex flex-col">
        <div :class="['text-normal', selected ? 'text-primary' : '']">
          {{ item.title }}
        </div>
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import { Roles, StreamRoles } from '@speckle/shared'

const emit = defineEmits<{
  (e: 'update:modelValue', v: StreamRoles): void
}>()

const props = defineProps<{
  modelValue: StreamRoles | string
  showLabel?: boolean
  name?: string
}>()

const items = ref<Record<StreamRoles, { id: StreamRoles; title: string }>>({
  [Roles.Stream.Owner]: {
    id: Roles.Stream.Owner,
    title: 'Owner'
  },
  [Roles.Stream.Contributor]: {
    id: Roles.Stream.Contributor,
    title: 'Can edit'
  },
  [Roles.Stream.Reviewer]: {
    id: Roles.Stream.Reviewer,
    title: 'Can view'
  }
})

const selectedValue = computed({
  get: () => props.modelValue as StreamRoles,
  set: (newVal) => emit('update:modelValue', newVal)
})

const selectValue = computed({
  get: () => items.value[selectedValue.value],
  set: (newVal) => (selectedValue.value = newVal.id)
})
</script>
