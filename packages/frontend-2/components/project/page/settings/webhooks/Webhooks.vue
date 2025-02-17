<template>
  <ProjectPageSettingsBlock title="Webhooks">
    <template #introduction>
      <p class="text-body-xs text-foreground">
        Subscribe to events and get notified in real time. Use to trigger CI apps,
        automation workflows, and more.
      </p>
    </template>
    <template #top-buttons>
      <FormButton
        color="outline"
        :icon-left="BookOpenIcon"
        to="https://speckle.guide/dev/server-webhooks.html"
        external
        target="_blank"
      >
        Docs
      </FormButton>
      <FormButton @click="openCreateWebhookDialog">New</FormButton>
    </template>
    <template v-if="webhooks.length !== 0">
      <LayoutTable
        class="mt-6"
        :columns="[
          { id: 'enabled', header: 'State', classes: 'col-span-1' },
          { id: 'data', header: 'Data', classes: 'col-span-5' },
          {
            id: 'triggers',
            header: 'Trigger events',
            classes: 'col-span-6 whitespace-break-spaces text-xs'
          }
        ]"
        :items="webhooks"
        :buttons="[
          {
            icon: PencilIcon,
            label: 'Edit',
            action: openEditWebhookDialog,
            class: '!text-primary'
          },
          {
            icon: TrashIcon,
            label: 'Delete',
            action: openDeleteWebhookDialog,
            class: '!text-danger'
          }
        ]"
      >
        <template #enabled="{ item }">
          <FormSwitch
            :model-value="!!item.enabled"
            :name="'switch-' + item.id"
            :show-label="false"
            @update:model-value="(newValue) => onEnabledChange(item, newValue)"
          />
        </template>
        <template #data="{ item }">
          <div class="flex flex-col">
            <h3
              class="font-medium text-sm truncate"
              :class="{ 'opacity-60': !item.enabled }"
            >
              {{ item.description }}
            </h3>

            <div class="flex gap-1 items-center">
              <div class="h-4 w-4" :class="{ grayscale: !item.enabled }">
                <InformationCircleIcon
                  v-if="getHistoryStatus(item) === HistoryStatus.NoEvents"
                  class="opacity-40"
                />
                <CheckCircleIcon
                  v-if="getHistoryStatus(item) === HistoryStatus.Called"
                  class="text-success"
                />
                <XCircleIcon
                  v-if="
                    [HistoryStatus.Alert, HistoryStatus.Error].includes(
                      getHistoryStatus(item)
                    )
                  "
                  class="text-danger"
                />
              </div>
              <span class="text-foreground opacity-50 text-xs truncate">
                {{ getHistoryStatusInfo(item) }}
              </span>
            </div>
            <span class="text-foreground opacity-50 text-xs truncate">
              {{ item.url }}
            </span>
          </div>
        </template>

        <template #triggers="{ item }">
          <div :class="{ 'opacity-60': !item.enabled }">
            {{ formatTriggers(item) }}
          </div>
        </template>
      </LayoutTable>
    </template>
    <template v-else>
      <div class="mt-6">
        <ProjectPageSettingsWebhooksEmptyState />
      </div>
    </template>
    <ProjectPageSettingsWebhooksDeleteDialog
      v-model:open="showDeleteWebhookDialog"
      :webhook="webhookToModify"
    />

    <ProjectPageSettingsWebhooksCreateOrEditDialog
      v-model:open="showEditWebhookDialog"
      :webhook="webhookToModify"
      :stream-id="projectId"
      @webhook-created="handleWebhookCreated"
    />
  </ProjectPageSettingsBlock>
</template>
<script setup lang="ts">
import { useMutation, useQuery } from '@vue/apollo-composable'
import {
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/vue/20/solid'
import { TrashIcon, PencilIcon, BookOpenIcon } from '@heroicons/vue/24/outline'
import { FormSwitch, LayoutTable } from '@speckle/ui-components'
import { projectWebhooksQuery } from '~~/lib/projects/graphql/queries'
import { updateWebhookMutation } from '~~/lib/projects/graphql/mutations'
import { useGlobalToast } from '~~/lib/common/composables/toast'
import type { WebhookItem } from '~~/lib/projects/helpers/types'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import type { Optional } from '@speckle/shared'

const projectId = computed(() => route.params.id as string)
const route = useRoute()

const { result: pageResult, refetch: refetchWebhooks } = useQuery(
  projectWebhooksQuery,
  () => ({
    projectId: projectId.value
  })
)

const { triggerNotification } = useGlobalToast()
const { mutate: updateMutation } = useMutation(updateWebhookMutation)

const webhookToModify = ref<WebhookItem | null>(null)
const showDeleteWebhookDialog = ref(false)
const showEditWebhookDialog = ref(false)

const webhooks = computed<WebhookItem[]>(() => {
  return pageResult.value?.project?.webhooks?.items || []
})

enum HistoryStatus {
  NoEvents = 0,
  Alert = 1,
  Called = 2,
  Error = 3
}

const getHistoryStatus = (item: WebhookItem) => {
  const recentHistory = item.history?.items?.[0]
  const status = recentHistory?.status as Optional<HistoryStatus>
  return status || HistoryStatus.NoEvents
}

const getHistoryStatusInfo = (item: WebhookItem) => {
  const recentHistory = item.history?.items?.[0]
  return recentHistory ? recentHistory.statusInfo : 'No events yet'
}

const formatTriggers = (item: WebhookItem): string => {
  return item.triggers
    .map((event, index, array) => `"${event}"${index < array.length - 1 ? ',' : ''}`)
    .join(' ')
}

const openDeleteWebhookDialog = (item: WebhookItem) => {
  webhookToModify.value = item
  showDeleteWebhookDialog.value = true
}

const openEditWebhookDialog = (item: WebhookItem) => {
  webhookToModify.value = item
  showEditWebhookDialog.value = true
}

const openCreateWebhookDialog = () => {
  webhookToModify.value = null
  showEditWebhookDialog.value = true
}

const handleWebhookCreated = () => {
  refetchWebhooks()
}

const onEnabledChange = async (item: WebhookItem, newValue: boolean) => {
  const result = await updateMutation(
    {
      webhook: {
        streamId: projectId.value,
        id: item.id,
        enabled: newValue
      }
    },
    {
      update: (cache, { data }) => {
        if (data?.webhookUpdate) {
          cache.modify({
            id: getCacheId('Webhook', item.id),
            fields: {
              enabled: () => newValue
            }
          })
        }
      }
    }
  ).catch(convertThrowIntoFetchResult)

  if (result?.data?.webhookUpdate) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: newValue ? 'Webhook Enabled' : 'Webhook Disabled'
    })
  } else {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to update webhook',
      description: getFirstErrorMessage(result?.errors)
    })
  }
}
</script>
