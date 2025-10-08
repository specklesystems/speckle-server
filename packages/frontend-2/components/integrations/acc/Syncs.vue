<template>
  <div class="flex flex-col space-y-2">
    <LayoutTable
      class="mt-6 bg-foundation"
      :columns="[
        { id: 'file', header: 'File', classes: 'col-span-4' },
        { id: 'status', header: 'Status', classes: 'col-span-4' },
        { id: 'createdBy', header: 'Created by', classes: 'col-span-3' },
        {
          id: 'actions',
          header: '',
          classes: 'col-span-1 flex items-center justify-end'
        }
      ]"
      :items="accSyncItems"
    >
      <template #file="{ item }">
        <div class="flex flex-col items-start overflow-hidden">
          <NuxtLink
            class="text-foreground-1 hover:text-blue-500 underline"
            :to="`/projects/${projectId}/models/${item.model?.id}`"
          >
            {{ item.accFileName }}
          </NuxtLink>
          <p
            v-if="item.accFileViewName"
            v-tippy="getViewNameLabel(item.accFileViewName)"
            class="text-ellipsis w-full whitespace-nowrap text-foreground-2 overflow-hidden"
          >
            {{ item.accFileViewName }}
          </p>
        </div>
      </template>
      <template #status="{ item }">
        <div class="flex items-center space-x-1">
          <CommonBadge
            v-tippy="formattedFullDate(item.updatedAt)"
            color-classes="w-12 bg-info-lighter justify-center"
          >
            {{ getVersionLabel(item.accFileVersionIndex) }}
          </CommonBadge>
          <IntegrationsAccSyncStatus :status="item.status" />
        </div>
      </template>
      <template #createdBy="{ item }">
        {{ item.author?.name }}
      </template>
      <template #actions="{ item }">
        <IntegrationsAccActionsMenu :target-sync-item="item" />
      </template>
    </LayoutTable>
  </div>
</template>

<script setup lang="ts">
import type { AccTokens } from '@speckle/shared/acc'
import { useQuery, useSubscription } from '@vue/apollo-composable'
import { projectAccSyncItemsQuery } from '~/lib/acc/graphql/queries'
import { onProjectAccSyncItemUpdatedSubscription } from '~/lib/acc/graphql/subscriptions'

const props = defineProps<{
  projectId: string
  tokens: AccTokens | undefined
  isLoggedIn: boolean
}>()

const { triggerNotification } = useGlobalToast()
const { formattedFullDate } = useDateFormatters()

const { result: accSyncItemsResult, refetch: refetchAccSyncItems } = useQuery(
  projectAccSyncItemsQuery,
  () => ({
    id: props.projectId
  })
)

const accSyncItems = computed(
  () => accSyncItemsResult.value?.project.accSyncItems.items || []
)

const { onResult: onProjectAccSyncItemsUpdated } = useSubscription(
  onProjectAccSyncItemUpdatedSubscription,
  () => ({
    id: props.projectId
  }),
  () => ({
    errorPolicy: 'all'
  })
)

const getVersionLabel = (versionNumber: number): string => {
  return `V${versionNumber}`
}

const getViewNameLabel = (viewName: string): string => {
  return `Revit View: ${viewName}`
}

onProjectAccSyncItemsUpdated((res) => {
  // TODO ACC: Mutate local cache instead of refetch
  refetchAccSyncItems()
  triggerNotification({
    type: ToastNotificationType.Info,
    title: `ACC sync model ${res.data?.projectAccSyncItemsUpdated.type.toLowerCase()}`,
    description: res.data?.projectAccSyncItemsUpdated.accSyncItem?.accFileName
  })
})
</script>
