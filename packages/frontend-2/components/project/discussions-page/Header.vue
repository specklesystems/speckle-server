<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink
        :to="projectRoute(project.id)"
        :name="project.name"
      ></HeaderNavLink>
      <HeaderNavLink
        :to="projectDiscussionsRoute(project.id)"
        name="Discussions"
      ></HeaderNavLink>
    </Portal>
    <div class="flex justify-between items-center mb-4">
      <h1 class="block h4 font-bold">Discussions</h1>
      <div class="space-x-2 flex items-center">
        <FormCheckbox
          v-model="finalIncludeArchived"
          name="includeArchived"
          :value="true"
          label="Include resolved"
        />
        <LayoutGridListToggle
          v-model="finalGridOrList"
          v-tippy="'Swap Grid/Card View'"
          class="shrink-0"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Optional } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectDiscussionsPageHeader_ProjectFragment } from '~~/lib/common/generated/gql/graphql'
import { projectRoute, projectDiscussionsRoute } from '~~/lib/common/helpers/route'
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
