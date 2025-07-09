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
    :help="
      disabled
        ? 'You must be an Owner of this project to change this setting'
        : undefined
    "
  >
    <template #something-selected="{ value }">
      <div>
        <div class="text-body-xs font-medium">
          {{ isArray(value) ? value[0].title : value.title }}
        </div>
        <span class="text-body-2xs opacity-70">
          {{ isArray(value) ? value[0].description : value.description }}
        </span>
      </div>
    </template>
    <template #option="{ item }">
      <div class="flex flex-col">
        <div class="text-body-xs font-medium">{{ item.title }}</div>
        <div class="text-body-2xs opacity-70">
          {{ item.description }}
        </div>
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import { isArray } from 'lodash-es'
import { SupportedProjectVisibility } from '~/lib/projects/helpers/visibility'
import type { MaybeNullOrUndefined } from '@speckle/shared'

const emit = defineEmits<{
  (e: 'update:modelValue', v: SupportedProjectVisibility): void
}>()

const props = defineProps<{
  modelValue: SupportedProjectVisibility
  showLabel?: boolean
  name?: string
  disabled?: boolean
  workspaceId?: MaybeNullOrUndefined<string>
}>()

const labelId = useId()
const buttonId = useId()
const items = computed(() => ({
  [SupportedProjectVisibility.Public]: {
    id: SupportedProjectVisibility.Public,
    description: 'Anyone with the link can view',
    title: 'Public'
  },
  ...(props.workspaceId
    ? {
        [SupportedProjectVisibility.Workspace]: {
          id: SupportedProjectVisibility.Workspace,
          description: 'All workspace members can view',
          title: 'Workspace'
        }
      }
    : {}),
  [SupportedProjectVisibility.Private]: {
    id: SupportedProjectVisibility.Private,
    description: 'Only for project members and admins',
    title: 'Private'
  }
}))

const selectedValue = computed({
  get: () => props.modelValue,
  set: (newVal) => emit('update:modelValue', newVal)
})

const selectValue = computed({
  get: () =>
    items.value[selectedValue.value] || items.value[SupportedProjectVisibility.Private],
  set: (newVal) => (selectedValue.value = newVal.id)
})
</script>
