<template>
  <div>
    <div v-if="project">
      <div class="mb-8">
        <div class="relative mb-3 flex items-center mt-10 justify-between">
          <h1 class="h2 font-bold">{{ project.name }}</h1>
          <div class="flex items-center space-x-2">
            <FormButton size="xs" :icon-left="XMarkIcon" rounded outlined>
              Import file
            </FormButton>
            <FormButton size="xs" :icon-left="XMarkIcon" rounded outlined>
              Share
            </FormButton>
            <FormButton size="xs" :icon-left="XMarkIcon" rounded outlined hide-text />
          </div>
          <NuxtLink class="absolute -left-10 top-2.5" :to="homeRoute">
            <ArrowLeftIcon class="h-6 w-6" />
          </NuxtLink>
        </div>
        <div v-if="project.description?.length" class="normal mt-3">
          {{ project.description }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/vue/24/solid'
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'
import { homeRoute } from '~~/lib/common/helpers/route'
import { projectPageQuery } from '~~/lib/projects/graphql/queries'

graphql(`
  fragment ProjectPageProject on Project {
    id
    name
    description
    createdAt
  }
`)

definePageMeta({
  middleware: ['require-valid-project']
})

const route = useRoute()
const { result: projectPageResult } = useQuery(projectPageQuery, () => ({
  id: route.params.id as string
}))

const project = computed(() => projectPageResult.value?.project)
</script>
