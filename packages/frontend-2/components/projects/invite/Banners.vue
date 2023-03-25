<template>
  <!-- Breakout div from main container -->
  <div
    class="w-[calc(100vw-8px)] ml-[calc(50%-50vw+4px)] mr-[calc(50%-50vw+4px)] -mt-6 mb-10 bg-blue-500/10 rounded-b-xl"
  >
    <div class="layout-container">
      <div class="flex flex-col">
        <ProjectsInviteBanner v-for="item in items" :key="item.id" :invite="item" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectsInviteBannersFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectsInviteBanners on User {
    projectInvites {
      ...ProjectsInviteBanner
    }
  }
`)

const props = defineProps<{
  invites: ProjectsInviteBannersFragment
}>()

const items = computed(() => props.invites.projectInvites)
</script>
