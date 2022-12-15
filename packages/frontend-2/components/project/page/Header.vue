<template>
  <div>
    <div class="relative mb-3 flex items-center mt-10 justify-between">
      <h1 class="h3 font-bold">{{ project.name }}</h1>
      <div class="flex items-center space-x-2">
        <FormButton size="xs" :icon-left="CloudArrowUpIcon" rounded outlined>
          Import file
        </FormButton>
        <FormButton size="xs" :icon-left="ShareIcon" rounded outlined>Share</FormButton>
        <FormButton
          size="xs"
          :icon-left="EllipsisVerticalIcon"
          rounded
          outlined
          hide-text
        />
      </div>
    </div>
    <div v-if="project.description?.length" class="normal mt-3">
      {{ project.description }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import {
  EllipsisVerticalIcon,
  ShareIcon,
  CloudArrowUpIcon
} from '@heroicons/vue/24/solid'
import { ProjectPageProjectHeaderFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectPageProjectHeader on Project {
    name
    description
  }
`)

defineProps<{
  project: ProjectPageProjectHeaderFragment
}>()
</script>
