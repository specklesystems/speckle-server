<template>
  <div class="mt-4 space-y-2">
    <FormSelectBase
      key="name"
      v-model="selectedDiscipline"
      name="discipline"
      label="Discipline"
      placeholder="Nothing selected"
      class="w-full"
      fixed-height
      show-label
      :items="filter.availableDisciplines"
      :allow-unset="false"
      mount-menu-on-body
    >
      <template #something-selected="{ value }">
        <span class="text-primary text-base text-sm">{{ value }}</span>
      </template>
      <template #option="{ item }">
        <span class="text-base text-sm">{{ item }}</span>
      </template>
    </FormSelectBase>
    <FormSelectBase
      key="name"
      v-model="selectedViewFamily"
      name="viewFamily"
      label="View Family"
      placeholder="Nothing selected"
      class="w-full"
      fixed-height
      show-label
      :items="availableViewFamilyKeys"
      :allow-unset="false"
      :disabled="!selectedDiscipline"
      mount-menu-on-body
    >
      <template #something-selected="{ value }">
        <span class="text-primary text-base text-sm">{{ value }}</span>
      </template>
      <template #option="{ item }">
        <span class="text-base text-sm">{{ item }}</span>
      </template>
    </FormSelectBase>
    <FormSelectBase
      key="name"
      v-model="selectedView"
      name="view"
      label="View"
      placeholder="Nothing selected"
      class="w-full"
      fixed-height
      show-label
      :items="availableViewFamilies[selectedViewFamily as string]"
      :allow-unset="false"
      :disabled="!selectedDiscipline || !selectedViewFamily"
      mount-menu-on-body
    >
      <template #something-selected="{ value }">
        <span class="text-primary text-base text-sm">{{ value }}</span>
      </template>
      <template #option="{ item }">
        <span class="text-base text-sm">{{ item }}</span>
      </template>
    </FormSelectBase>
  </div>
</template>

<script setup lang="ts">
import type { ISendFilter, RevitViewsSendFilter } from '~/lib/models/card/send'

const emit = defineEmits<{
  (e: 'update:filter', filter: ISendFilter): void
}>()

const props = defineProps<{
  filter: RevitViewsSendFilter
}>()

const selectedDiscipline = ref<string>(props.filter.selectedViewDiscipline)
const selectedViewFamily = ref<string>(props.filter.selectedViewFamily)
const selectedView = ref<string>(props.filter.selectedView)

const availableViewFamilies = computed(() => {
  const newObj: Record<string, string[]> = {}
  Object.keys(props.filter.availableViews).forEach((key) => {
    const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1)
    newObj[capitalizedKey] = props.filter.availableViews[key]
  })
  return newObj
})

const availableViewFamilyKeys = computed(() => Object.keys(availableViewFamilies.value))

watch(
  selectedView,
  (newValue) => {
    const filter = { ...props.filter } as RevitViewsSendFilter
    filter.selectedViewDiscipline = selectedDiscipline.value as string
    filter.selectedViewFamily = selectedViewFamily.value as string
    filter.selectedView = newValue as string
    emit('update:filter', filter)
  },
  { deep: true, immediate: true }
)
</script>
