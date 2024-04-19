<template>
  <FormSelectBase
    v-model="selectValue"
    :items="Object.values(items)"
    label="Project visibility"
    :show-label="showLabel"
    :name="name || 'visibility'"
    :allow-unset="false"
    :disabled="disabled"
    :label-id="labelId"
    :button-id="buttonId"
    by="id"
  >
    <template #something-selected="{ value }">
      <div class="text-sm">
        <div class="font-bold">
          {{ isArray(value) ? value[0].title : value.title }}
        </div>
        <span class="text-foreground-2 text-xs sm:text-sm">
          {{ isArray(value) ? value[0].description : value.description }}
        </span>
      </div>
    </template>
    <template #option="{ item }">
      <div class="flex flex-col">
        <div class="label">{{ item.title }}</div>
        <div class="label label--light text-foreground-2 text-xs sm:text-sm">
          {{ item.description }}
        </div>
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import { ProjectVisibility } from '~~/lib/common/generated/gql/graphql'
import { isArray } from 'lodash-es'

const emit = defineEmits<{
  (e: 'update:modelValue', v: ProjectVisibility): void
}>()

const props = defineProps<{
  modelValue: ProjectVisibility
  showLabel?: boolean
  name?: string
  disabled?: boolean
}>()

const labelId = useId()
const buttonId = useId()
const items = ref<
  Record<
    ProjectVisibility,
    { id: ProjectVisibility; description: string; title: string }
  >
>({
  [ProjectVisibility.Public]: {
    id: ProjectVisibility.Public,
    description: 'Project will be visible to everyone',
    title: 'Discoverable'
  },
  [ProjectVisibility.Unlisted]: {
    id: ProjectVisibility.Unlisted,
    description: 'Anyone with the link will be able to view',
    title: 'Link Shareable'
  },
  [ProjectVisibility.Private]: {
    id: ProjectVisibility.Private,
    description: 'Only team members will have access',
    title: 'Private'
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
