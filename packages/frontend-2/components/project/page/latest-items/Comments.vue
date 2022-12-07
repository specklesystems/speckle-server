<template>
  <ProjectPageLatestItems :count="6" title="Latest Comments">
    <template #default="{ gridOrList }">
      <ProjectPageLatestItemsCommentsGrid
        v-if="gridOrList === GridListToggleValue.Grid"
      />
      <template v-else>LIST VIEW NOT IMPLEMENTED</template>
    </template>
  </ProjectPageLatestItems>
</template>
<script setup lang="ts">
import { GridListToggleValue } from '~~/lib/layout/helpers/components'
</script>
