<template>
  <UserAvatar logo="test" alt="test" />
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'

graphql(`
  fragment WorkspaceAvatar_Workspace on Workspace {
    id
    name
    logo
    defaultLogoIndex
`)
</script>
