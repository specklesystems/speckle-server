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
      <LayoutGridListToggle
        v-model="finalGridOrList"
        v-tippy="'Swap Grid/Card View'"
        class="shrink-0"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
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
}>()

const props = defineProps<{
  project: ProjectDiscussionsPageHeader_ProjectFragment
  gridOrList: GridListToggleValue
}>()

const finalGridOrList = computed({
  get: () => props.gridOrList,
  set: (newVal) => emit('update:grid-or-list', newVal)
})
</script>
