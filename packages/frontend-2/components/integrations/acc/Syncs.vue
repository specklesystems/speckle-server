<template>
  <div class="flex flex-col space-y-2">
    <div class="flex text-body-xs text-foreground font-medium">Sync models</div>
    <LayoutTable
      class="bg-foundation"
      :columns="[
        { id: 'status', header: 'Status', classes: 'col-span-2' },
        { id: 'accFileName', header: 'File name', classes: 'col-span-2' },
        { id: 'accFileViewName', header: 'View name', classes: 'col-span-2' },
        { id: 'modelId', header: 'Model id', classes: 'col-span-2' },
        { id: 'createdBy', header: 'Created by', classes: 'col-span-2' },
        { id: 'actions', header: 'Actions', classes: 'col-span-2' }
      ]"
      :items="accSyncItems"
    >
      <template #status="{ item }">
        <IntegrationsAccSyncStatus :status="item.status" />
      </template>
      <template #accFileName="{ item }">
        {{ item.accFileName }}
      </template>
      <template #accFileViewName="{ item }">
        {{ item.accFileViewName || '-' }}
      </template>
      <template #modelId="{ item }">
        <NuxtLink
          class="text-foreground-1 hover:text-blue-500 underline"
          :to="`/projects/${projectId}/models/${item.model?.id}`"
        >
          {{ item.model?.id }}
        </NuxtLink>
      </template>
      <template #createdBy="{ item }">
        {{ item.author?.name }}
      </template>
      <template #actions="{ item }">
        <div class="space-x-2">
          <FormButton
            hide-text
            color="outline"
            :icon-left="item.status === 'paused' ? PlayIcon : PauseIcon"
            @click="handleStatusSyncItem(item.id, item.status === 'paused')"
          />
          <FormButton
            hide-text
            color="outline"
            :icon-left="TrashIcon"
            @click="handleDeleteSyncItem(item.id)"
          />
        </div>
      </template>
    </LayoutTable>
  </div>
</template>

<script setup lang="ts">
import type { AccTokens } from '@speckle/shared/acc'
import { useMutation, useQuery, useSubscription } from '@vue/apollo-composable'
import {
  accSyncItemDeleteMutation,
  accSyncItemUpdateMutation
} from '~/lib/acc/graphql/mutations'
import { projectAccSyncItemsQuery } from '~/lib/acc/graphql/queries'
import { onProjectAccSyncItemUpdatedSubscription } from '~/lib/acc/graphql/subscriptions'
import { PauseIcon } from '@heroicons/vue/24/solid'
import { TrashIcon, PlayIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  projectId: string
  tokens: AccTokens | undefined
  isLoggedIn: boolean
}>()

const { triggerNotification } = useGlobalToast()

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
  })
)

onProjectAccSyncItemsUpdated((res) => {
  // TODO ACC: Mutate local cache instead of refetch
  refetchAccSyncItems()
  triggerNotification({
    type: ToastNotificationType.Info,
    title: `ACC sync model ${res.data?.projectAccSyncItemsUpdated.type.toLowerCase()}`,
    description: res.data?.projectAccSyncItemsUpdated.accSyncItem?.accFileName
  })
})

const { mutate: deleteAccSyncItem } = useMutation(accSyncItemDeleteMutation)

const handleDeleteSyncItem = async (id: string) => {
  try {
    await deleteAccSyncItem({
      input: {
        projectId: props.projectId,
        id
      }
    })
  } catch (error) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Delete sync item failed',
      description: error instanceof Error ? error.message : 'Unexpected error'
    })
  }
}

const { mutate: updateAccSyncItem } = useMutation(accSyncItemUpdateMutation)

const handleStatusSyncItem = async (id: string, isPaused: boolean) => {
  try {
    await updateAccSyncItem({
      input: {
        projectId: props.projectId,
        id,
        status: isPaused ? 'pending' : 'paused'
      }
    })
  } catch (error) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Update sync item failed',
      description: error instanceof Error ? error.message : 'Unexpected error'
    })
  }
}
</script>
