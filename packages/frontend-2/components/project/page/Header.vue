<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink
        :to="projectRoute(project.id)"
        :name="project.name"
      ></HeaderNavLink>
    </Portal>
    <CommonTitleDescription :title="project.name" :description="project.description" />
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectPageProjectHeaderFragment } from '~~/lib/common/generated/gql/graphql'
import { projectRoute } from '~~/lib/common/helpers/route'

graphql(`
  fragment ProjectPageProjectHeader on Project {
    id
    role
    name
    description
    visibility
    allowPublicComments
  }
`)

defineProps<{
  project: ProjectPageProjectHeaderFragment
}>()
</script>
