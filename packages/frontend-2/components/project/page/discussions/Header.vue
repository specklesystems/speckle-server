<template>
  <div>
    <div class="flex justify-between sm:items-center mb-8">
      <h1 class="block h4 font-bold">Discussions</h1>
      <div class="gap-2 flex items-end sm:items-center flex-col sm:flex-row">
        <div class="order-2 sm:order-1">
          <FormCheckbox
            v-model="finalIncludeArchived"
            name="includeArchived"
            :value="true"
            label="Include resolved"
          />
        </div>
        <LayoutGridListToggle
          v-model="finalGridOrList"
          class="shrink-0 order-1 sm:order-2"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Optional } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectDiscussionsPageHeader_ProjectFragment } from '~~/lib/common/generated/gql/graphql'
import { GridListToggleValue } from '~~/lib/layout/helpers/components'

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
</script>
