<template>
  <!-- Breakout div from main container -->

  <div class="flex flex-col bg-highlight-2 rounded-md mb-4 -mt-3">
    <ProjectsInviteBanner
      v-for="item in items"
      :key="item.id"
      :invite="item"
      @processed="$emit('processed', $event)"
    />
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectsInviteBannersFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectsInviteBanners on User {
    projectInvites {
      ...ProjectsInviteBanner
    }
  }
`)

defineEmits<{
  (e: 'processed', val: { accepted: boolean }): void
}>()

const props = defineProps<{
  invites: ProjectsInviteBannersFragment
}>()

const items = computed(() => props.invites.projectInvites)
</script>
