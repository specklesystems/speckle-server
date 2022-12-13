<template>
  <ProjectPageLatestItems :count="6" title="Latest Threads">
    <template #default="{ gridOrList }">
      <ProjectPageLatestItemsCommentsGrid
        v-if="gridOrList === GridListToggleValue.Grid"
      />
      <ProjectPageLatestItemsCommentsList v-else />
    </template>
  </ProjectPageLatestItems>
</template>
<script setup lang="ts">
import { GridListToggleValue } from '~~/lib/layout/helpers/components'
</script>
