<template>
  <div>
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
      class="mt-8"
      :headers="[
        { id: 'state', title: 'State' },
        { id: 'data', title: 'Data' },
        { id: 'triggerEvents', title: 'Trigger Events' }
      ]"
      :items="webhooks"
      :buttons="[
        {
          icon: PencilIcon,
          label: 'Edit',
          action: (item) => console.log('Edit', item),
          class: 'text-primary'
        },
        {
          icon: TrashIcon,
          label: 'Delete',
          action: openDeleteWebhookDialog,
          class: 'text-red-500'
        }
      ]"
      :column-classes="{
        state: 'col-span-1',
        data: 'col-span-5',
        triggerEvents: 'col-span-6 whitespace-break-spaces text-xs'
      }"
    >
      <template #state="{ item }">
        <FormSwitch v-model="item.state" />
      </template>
      <template #data="{ item }">
        <div class="flex flex-col">
          <h3 class="font-bold text-base truncate">{{ item.description }}</h3>
          <div class="flex gap-1.5 items-center">
            <div class="h-4 w-4">
              <InformationCircleIcon
                v-if="item.historyStatus === 'noEvents'"
                class="opacity-40"
              />
              <CheckCircleIcon
                v-if="item.historyStatus === 'called'"
                class="text-success"
              />
              <XCircleIcon
                v-if="item.historyStatus === 'error' || item.historyStatus === 'alert'"
                class="text-danger"
              />
              <QuestionMarkCircleIcon
                v-if="item.historyStatus === 'unknown'"
                class="opacity-40"
              />
            </div>
            <span class="text-foreground opacity-50 text-sm truncate">
              {{ item.historyStatusInfo }}
            </span>
          </div>
          <span class="text-foreground opacity-50 text-sm truncate">
            {{ item.url }}
          </span>
        </div>
      </template>
      <template #triggerEvents="{ item }">
        <div :class="{ 'opacity-60': !item.state }">
          {{
            (item.triggerEvents as string[])
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
      :webhook="inviteToModify"
      :result-variables="resultVariables"
    />

    <InfiniteLoading
      :settings="{ identifier: infiniteLoaderId }"
      class="py-4"
      @infinite="infiniteLoad"
    />
    <ProjectWebhooksPageDialogCreateWebhook
      v-model:open="showNewWebhookDialog"
      :url="urlValue"
      :name="nameValue"
      :secret="secretValue"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import {
  PlusIcon,
  BookOpenIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/vue/20/solid'
import { TrashIcon, PencilIcon } from '@heroicons/vue/24/outline'
import { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import { projectWebhooksQuery } from '~~/lib/projects/graphql/queries'
import { FormSwitch } from '@speckle/ui-components'
import { isWebhook } from '~~/lib/projects/helpers/utils'
import { WebhookItem } from '~~/lib/projects/helpers/types'
import { ItemType } from '@speckle/ui-components/dist/components/layout/Table.vue'

const logger = useLogger()
const route = useRoute()

const projectId = computed(() => route.params.id as string)

const inviteToModify = ref<WebhookItem | null>(null)
const showDeleteWebhookDialog = ref(false)
const infiniteLoaderId = ref('')
const showNewWebhookDialog = ref(false)
const urlValue = ref('')
const nameValue = ref('')
const secretValue = ref('')

const {
  result: extraPagesResult,
  fetchMore: fetchMorePages,
  variables: resultVariables,
  onResult
} = useQuery(projectWebhooksQuery, () => ({
  projectId: projectId.value
}))

const moreToLoad = computed(
  () =>
    !extraPagesResult.value?.project?.webhooks ||
    (extraPagesResult.value?.project?.webhooks?.items?.length ?? 0) <
      (extraPagesResult.value?.project?.webhooks?.totalCount ?? 0)
)

const webhooks = computed(() => {
  return (
    extraPagesResult.value?.project?.webhooks?.items?.map((webhook) => {
      const recentHistory = webhook?.history?.items?.[0]
      let historyStatus, historyStatusInfo

      if (recentHistory) {
        switch (recentHistory.status) {
          case 0:
          case 1:
            historyStatus = 'alert'
            historyStatusInfo = recentHistory.statusInfo
            break
          case 2:
            historyStatus = 'called'
            historyStatusInfo = 'Webhook Called'
            break
          case 3:
            historyStatus = 'error'
            historyStatusInfo = recentHistory.statusInfo
            break
          default:
            historyStatus = 'unknown'
            historyStatusInfo = recentHistory.statusInfo
        }
      } else {
        historyStatus = 'noEvents'
        historyStatusInfo = 'No events yet'
      }

      return {
        id: webhook.id,
        state: !!webhook?.enabled,
        url: webhook?.url,
        description: webhook?.description,
        streamId: webhook?.streamId,
        historyStatus,
        historyStatusInfo,
        triggerEvents: webhook?.triggers
      }
    }) || []
  )
})

const openDeleteWebhookDialog = (item: ItemType) => {
  if (isWebhook(item as WebhookItem)) {
    inviteToModify.value = item as WebhookItem
    showDeleteWebhookDialog.value = true
  }
}

const infiniteLoad = async (state: InfiniteLoaderState) => {
  const cursor = extraPagesResult.value?.project?.webhooks.cursor || null
  if (!moreToLoad.value || !cursor) return state.complete()

  try {
    await fetchMorePages({
      variables: {
        cursor
      }
    })
  } catch (e) {
    logger.error(e)
    state.error()
    return
  }

  state.loaded()
  if (!moreToLoad.value) {
    state.complete()
  }
}

const calculateLoaderId = () => {
  infiniteLoaderId.value = resultVariables.value?.query || ''
}

onResult(calculateLoaderId)
</script>
