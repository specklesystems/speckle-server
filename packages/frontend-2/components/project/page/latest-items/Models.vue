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
        v-model="selectedMembers"
        :users="fakeUsers"
        multiple
        search
        selector-placeholder="All members"
        label="Filter by members"
        class="w-56"
      />
    </template>
  </ProjectPageLatestItems>
</template>
<script setup lang="ts">
import { GridListToggleValue } from '~~/lib/layout/helpers/components'
import { fakeUsers } from '~~/components/form/select/Users.stories'
import { FormUsersSelectItemFragment } from '~~/lib/common/generated/gql/graphql'

const selectedMembers = ref([] as FormUsersSelectItemFragment[])
</script>
