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
import { ProjectRole } from '~~/lib/common/generated/gql/graphql'

const emit = defineEmits<{
  (e: 'update:modelValue', v: ProjectRole): void
}>()

const props = defineProps<{
  modelValue: ProjectRole
  showLabel?: boolean
  name?: string
}>()

const items = ref<Record<ProjectRole, { id: ProjectRole; title: string }>>({
  [ProjectRole.Owner]: {
    id: ProjectRole.Owner,
    title: 'Owner'
  },
  [ProjectRole.Contributor]: {
    id: ProjectRole.Contributor,
    title: 'Can edit'
  },
  [ProjectRole.Reviewer]: {
    id: ProjectRole.Reviewer,
    title: 'Can view'
  }
})

const selectedValue = computed({
  get: () => props.modelValue,
  set: (newVal) => emit('update:modelValue', newVal)
})

const selectValue = computed({
  get: () => items.value[selectedValue.value],
  set: (newVal) => (selectedValue.value = newVal.id)
})
</script>
