<template>
  <div>
    <div v-if="project">
      <!-- Heading text w/ actions -->
      <ProjectPageHeader :project="project" class="mb-8" />
      <!-- Stats blocks -->
      <div class="grid grid-cols-12 gap-8">
        <ProjectPageStatsBlock>
          <template #top>
            <div class="flex justify-between items-center">
              <div class="flex items-center space-x-1.5">
                <UsersIcon class="h-5 w-5" />
                <span class="label font-bold">Team</span>
                <CommonBadge color-classes="text-foreground-on-primary bg-info-darker">
                  12
                </CommonBadge>
              </div>
              <div class="caption">
                <NuxtLink to="javascript:void(0);">View all</NuxtLink>
              </div>
            </div>
          </template>
          <template #bottom>
            <div class="flex space-x-[1px]">
              <div class="flex space-x-[1px] flex-wrap overflow-hidden h-8">
                <UserAvatar />
                <UserAvatar />
                <UserAvatar />
                <UserAvatar />
                <UserAvatar />
                <UserAvatar />
                <UserAvatar />
              </div>
              <UserAvatarPlus />
            </div>
          </template>
        </ProjectPageStatsBlock>
        <ProjectPageStatsBlock>Hello world</ProjectPageStatsBlock>
        <ProjectPageStatsBlock>Hello world</ProjectPageStatsBlock>
        <ProjectPageStatsBlock>Hello world</ProjectPageStatsBlock>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { UsersIcon } from '@heroicons/vue/20/solid'
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'
import { projectPageQuery } from '~~/lib/projects/graphql/queries'

graphql(`
  fragment ProjectPageProject on Project {
    id
    createdAt
    ...ProjectPageProjectHeader
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
