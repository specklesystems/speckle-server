<template>
  <section>
    <div class="md:max-w-5xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader
        title="Regions"
        text="Manage the regions available for customizing data residency"
      />
      <div class="flex flex-col space-y-6">
        <div class="flex flex-row-reverse">
          <div v-tippy="disabledMessage">
            <FormButton :disabled="!canCreateRegion" @click="onCreate">
              Create
            </FormButton>
          </div>
        </div>
        <SettingsServerRegionsTable :items="tableItems" @edit="onEditRegion" />
      </div>
    </div>
    <SettingsServerRegionsAddEditDialog
      v-model="editModel"
      v-model:open="isAddEditDialogOpen"
      :available-region-keys="availableKeys"
    />
  </section>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import type { SettingsServerRegionsTable_ServerRegionItemFragment } from '~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'

const isAddEditDialogOpen = ref(false)

const query = graphql(`
  query SettingsServerRegions {
    serverInfo {
      multiRegion {
        regions {
          id
          ...SettingsServerRegionsTable_ServerRegionItem
        }
        availableKeys
      }
    }
  }
`)

const editModel = ref<SettingsServerRegionsTable_ServerRegionItemFragment>()

const pageFetchPolicy = usePageQueryStandardFetchPolicy()
const { result } = useQuery(query, undefined, () => ({
  fetchPolicy: pageFetchPolicy.value
}))

const tableItems = computed(() => result.value?.serverInfo?.multiRegion?.regions)
const availableKeys = computed(
  () => result.value?.serverInfo?.multiRegion?.availableKeys || []
)
const canCreateRegion = computed(() => availableKeys.value.length > 0)
const disabledMessage = computed(() => {
  if (canCreateRegion.value) return undefined

  if (!availableKeys.value.length) return 'No available region keys'

  return undefined
})

const onCreate = () => {
  editModel.value = undefined
  isAddEditDialogOpen.value = true
}

const onEditRegion = (item: SettingsServerRegionsTable_ServerRegionItemFragment) => {
  editModel.value = item
  isAddEditDialogOpen.value = true
}
</script>
