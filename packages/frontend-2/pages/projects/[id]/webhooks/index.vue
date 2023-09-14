<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink :to="projectRoute(projectId)" name="Name"></HeaderNavLink>
      <HeaderNavLink
        :to="`${projectRoute(projectId)}/webhooks`"
        name="Webhooks"
      ></HeaderNavLink>
    </Portal>
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Webhooks</h1>
      <div class="flex gap-2">
        <FormButton color="secondary" :icon-left="BookOpenIcon">Open Docs</FormButton>
        <FormButton :icon-left="PlusIcon" @click="showNewWebhookDialog = true">
          Create Webhook
        </FormButton>
      </div>
    </div>
    <div class="my-8 text-sm">
      Webhooks allow you to subscribe to a stream's events and get notified of them in
      real time. You can then use this to trigger ci apps, automation workflows, and
      more.
    </div>

    <LayoutTable
      :columns="[
        { id: 'enabled', header: 'State', classes: 'col-span-1' },
        { id: 'data', header: 'Data', classes: 'col-span-5' },
        {
          id: 'triggers',
          header: 'Trigger Events',
          classes: 'col-span-6 whitespace-break-spaces text-xs'
        }
      ]"
      :items="webhooks"
      :buttons="[
        {
          icon: PencilIcon,
          label: 'Edit',
          action: openEditWebhookDialog,
          class: 'text-primary'
        },
        {
          icon: TrashIcon,
          label: 'Delete',
          action: openDeleteWebhookDialog,
          class: 'text-red-500'
        }
      ]"
    >
      <template #enabled="{ item }">
        <FormSwitch
          :model-value="(item.enabled as boolean)"
          @update:model-value="(newValue) => onChange(item, newValue)"
        />
      </template>
      <template #data="{ item }">
        <div class="flex flex-col">
          <h3 class="font-bold text-base truncate">{{ item.description }}</h3>
          <div class="flex gap-1.5 items-center">
            <div class="h-4 w-4">
              <InformationCircleIcon
                v-if="getHistoryStatus(item) === 'noEvents'"
                class="opacity-40"
              />
              <CheckCircleIcon
                v-if="getHistoryStatus(item) === 'called'"
                class="text-success"
              />
              <XCircleIcon
                v-if="
                  getHistoryStatus(item) === 'error' ||
                  getHistoryStatus(item) === 'alert'
                "
                class="text-danger"
              />
            </div>
            <span class="text-foreground opacity-50 text-sm truncate">
              {{ getHistoryStatusInfo(item) }}
            </span>
          </div>
          <span class="text-foreground opacity-50 text-sm truncate">
            {{ item.url }}
          </span>
        </div>
      </template>

      <template #triggers="{ item }">
        <div :class="{ 'opacity-60': !item.enabled }">
          {{
            (item.triggers as string[])
              .map(
                (event, index, array) =>
                  `"${event}"${index < array.length - 1 ? ',' : ''}`
              )
              .join(' ')
          }}
        </div>
      </template>
    </LayoutTable>

    <ProjectWebhooksPageDeleteWebhookDialog
      v-model:open="showDeleteWebhookDialog"
      :webhook="webhookToModify"
      :result-variables="resultVariables"
    />

    <ProjectWebhooksPageEditWebhookDialog
      v-model:open="showEditWebhookDialog"
      :webhook="webhookToModify"
    />

    <ProjectWebhooksPageCreateWebhookDialog
      v-model:open="showNewWebhookDialog"
      :url="urlValue"
      :name="nameValue"
      :secret="secretValue"
      :stream-id="projectId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMutation, useQuery } from '@vue/apollo-composable'
import {
  PlusIcon,
  BookOpenIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/vue/20/solid'
import { TrashIcon, PencilIcon } from '@heroicons/vue/24/outline'
import { projectWebhooksQuery } from '~~/lib/projects/graphql/queries'
import { FormSwitch, ToastNotificationType } from '@speckle/ui-components'
import { projectRoute } from '~~/lib/common/helpers/route'
import { isWebhook } from '~~/lib/projects/helpers/utils'
import { WebhookItem } from '~~/lib/projects/helpers/types'
import { TableItemType } from '@speckle/ui-components'
import { updateWebhookMutation } from '~~/lib/projects/graphql/mutations'
import { useGlobalToast } from '~~/lib/common/composables/toast'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'

const { triggerNotification } = useGlobalToast()
const { mutate: updateMutation } = useMutation(updateWebhookMutation)

const route = useRoute()

const projectId = computed(() => route.params.id as string)

const webhookToModify = ref<TableItemType<WebhookItem> | null>(null)
const showDeleteWebhookDialog = ref(false)
const showEditWebhookDialog = ref(false)
const showNewWebhookDialog = ref(false)
const urlValue = ref('')
const nameValue = ref('')
const secretValue = ref('')

const { result: pageResult, variables: resultVariables } = useQuery(
  projectWebhooksQuery,
  () => ({
    projectId: projectId.value
  })
)

const getHistoryStatus = (item: TableItemType<WebhookItem>) => {
  const recentHistory = item.history?.items?.[0]
  if (recentHistory) {
    switch (recentHistory.status) {
      case 0:
      case 1:
        return 'alert'
      case 2:
        return 'called'
      case 3:
        return 'error'
      default:
        return 'noEvents'
    }
  }
}

const getHistoryStatusInfo = (item: TableItemType<WebhookItem>) => {
  if (isWebhook(item)) {
    const recentHistory = item.history?.items?.[0]
    if (recentHistory) {
      return recentHistory.statusInfo
    } else {
      return 'No events yet'
    }
  }
}

const webhooks = computed<WebhookItem[]>(() => {
  return (
    pageResult.value?.project?.webhooks?.items?.map(
      (webhook) => webhook as WebhookItem
    ) || []
  )
})

const openDeleteWebhookDialog = (item: TableItemType<WebhookItem>) => {
  if (isWebhook(item)) {
    webhookToModify.value = item
    showDeleteWebhookDialog.value = true
  }
}

const openEditWebhookDialog = (item: TableItemType<WebhookItem>) => {
  if (isWebhook(item)) {
    webhookToModify.value = item
    showEditWebhookDialog.value = true
  }
}

const onChange = async (item: TableItemType<WebhookItem>, newValue: boolean) => {
  if (!isWebhook(item)) {
    return
  }

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
      title: 'Webhook updated'
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
