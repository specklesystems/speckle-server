<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <h1 class="block text-heading-xl">Discussions</h1>
      <div class="space-x-2 flex items-center">
        <FormCheckbox
          :id="checkboxId"
          v-model="finalIncludeArchived"
          name="includeArchived"
          :value="true"
          label="Include resolved"
        />
        <LayoutGridListToggle v-model="finalGridOrList" class="shrink-0" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Optional } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectDiscussionsPageHeader_ProjectFragment } from '~~/lib/common/generated/gql/graphql'
import type { GridListToggleValue } from '~~/lib/layout/helpers/components'

graphql(`
  fragment ProjectDiscussionsPageHeader_Project on Project {
    id
    name
  }
`)

const emit = defineEmits<{
  (e: 'update:grid-or-list', val: GridListToggleValue): void
  (e: 'update:include-archived', val: boolean): void
}>()

const props = defineProps<{
  project: ProjectDiscussionsPageHeader_ProjectFragment
  includeArchived: Optional<true>
  gridOrList: GridListToggleValue
}>()

const finalGridOrList = computed({
  get: () => props.gridOrList,
  set: (newVal) => emit('update:grid-or-list', newVal)
})

const finalIncludeArchived = computed({
  get: () => props.includeArchived,
  set: (newVal) => emit('update:include-archived', newVal)
})

const checkboxId = useId()
</script>
