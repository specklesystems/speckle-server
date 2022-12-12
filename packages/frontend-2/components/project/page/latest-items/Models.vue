<template>
  <ProjectPageLatestItems :count="8" title="Latest Models">
    <template #default="{ gridOrList }">
      <ProjectPageLatestItemsModelsGrid
        v-if="gridOrList === GridListToggleValue.Grid"
      />
      <ProjectPageLatestItemsModelsList v-else />
    </template>
    <template #filters>
      <div class="flex items-center">
        <FormSelectUsers
          v-model="selectedMembers"
          :users="fakeUsers"
          multiple
          search
          selector-placeholder="All members"
          label="Filter by members"
          class="w-56 mr-4"
        />
        <FormSelectSourceApps
          v-model="selectedApps"
          multiple
          selector-placeholder="All sources"
          label="Filter by sources"
          class="w-44"
        />
      </div>
    </template>
  </ProjectPageLatestItems>
</template>
<script setup lang="ts">
import { GridListToggleValue } from '~~/lib/layout/helpers/components'
import { fakeUsers } from '~~/components/form/select/Users.stories'
import { FormUsersSelectItemFragment } from '~~/lib/common/generated/gql/graphql'
import { SourceAppDefinition } from '@speckle/shared'

const selectedMembers = ref([] as FormUsersSelectItemFragment[])
const selectedApps = ref([] as SourceAppDefinition[])
</script>
