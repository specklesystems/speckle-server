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
import { SimpleProjectVisibility } from '~/lib/common/generated/gql/graphql'

const emit = defineEmits<{
  (e: 'update:modelValue', v: SimpleProjectVisibility): void
}>()

const props = defineProps<{
  modelValue: SimpleProjectVisibility
  showLabel?: boolean
  name?: string
  disabled?: boolean
}>()

const labelId = useId()
const buttonId = useId()
const items = ref<
  Record<
    SimpleProjectVisibility,
    { id: SimpleProjectVisibility; description: string; title: string }
  >
>({
  [SimpleProjectVisibility.Unlisted]: {
    id: SimpleProjectVisibility.Unlisted,
    description: 'Anyone with the link can view',
    title: 'Link shareable'
  },
  [SimpleProjectVisibility.Private]: {
    id: SimpleProjectVisibility.Private,
    description: 'Only collaborators can access',
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
