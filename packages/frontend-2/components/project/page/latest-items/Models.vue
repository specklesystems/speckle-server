<template>
  <ProjectPageLatestItems :count="8" title="Latest Models">
    <template #default="{ gridOrList }">
      <ProjectPageLatestItemsModelsGrid
        v-if="gridOrList === GridListToggleValue.Grid"
      />
      <template v-else>LIST VIEW NOT IMPLEMENTED</template>
    </template>
    <template #filters>
      <FormSelectUsers
        :users="fakeUsers"
        multiple
        selector-placeholder="All members"
        label="Filter by members"
      />
    </template>
  </ProjectPageLatestItems>
</template>
<script setup lang="ts">
import { GridListToggleValue } from '~~/lib/layout/helpers/components'
import { fakeUsers } from '~~/components/form/select/Users.stories'
</script>
