<template>
  <div
    :class="`pt-2 sm:py-2 my-2 sm:my-2 px-2 flex flex-col bg-foundation border-l-4 hover:shadow-lg  rounded transition cursor-pointer dark:border-gray-800 border-gray-300 border
      ${expanded ? 'border-primary ' : 'hover:bg-primary-muted'}
    `"
  >
    <button
      class="flex flex-col justify-between space-x-1 max-w-full w-full px-1 transition"
      @click="highlightObjects"
    >
      <div class="flex items-center space-x-2">
        <UserAvatarGroup :users="threadAuthors" class="flex-grow" />
        <div class="flex items-center space-x-1">
          <span class="grow truncate text-body-xs font-medium text-foreground-2">
            {{ thread.author.name }}
            <span v-if="threadAuthors.length !== 1">
              & {{ thread.replyAuthors.totalCount }} others
            </span>
          </span>
        </div>
      </div>

      <div class="truncate text-body-xs mt-1">
        {{ thread.rawText }}
      </div>
      <div
        :class="`text-xs font-medium flex items-center space-x-2 ${
          hasReply ? 'text-primary' : 'text-foreground-2'
        }`"
      >
        <FormButton
          :disabled="thread.replies.totalCount === 0"
          text
          link
          @click="expanded = !expanded"
        >
          {{ thread.replies.totalCount }}
          {{ thread.replies.totalCount === 1 ? 'reply' : 'replies' }}
        </FormButton>
        <span class="text-foreground-2 text-body-2xs">
          {{ createdAt }}
        </span>
      </div>
    </button>
    <div v-if="expanded && hasReply" class="px-2 pb-2 space-y-1 shadow-inner">
      <CommentsThreadReplyItem
        v-for="reply in replies"
        :key="reply.id"
        :reply="reply"
      ></CommentsThreadReplyItem>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommentThreadsItemFragment } from '~/lib/common/generated/gql/graphql'
import { objectQuery } from '~/lib/graphql/mutationsAndQueries'
import { useQuery } from '@vue/apollo-composable'
import { useAccountStore } from '~/store/accounts'
import type { IModelCard } from '~/lib/models/card'
import { useHostAppStore } from '~/store/hostApp'
import type { IReceiverModelCard } from '~/lib/models/card/receiver'
import dayjs from 'dayjs'

const props = defineProps<{
  modelCard: IModelCard
  thread: CommentThreadsItemFragment
}>()

const isSender = computed(() => {
  return props.modelCard.typeDiscriminator.includes('SenderModelCard')
})

const createdAt = computed(() => {
  return dayjs(props.thread.createdAt).from(dayjs())
})

const hasReply = computed(() => {
  return props.thread.replies.totalCount !== 0
})

const replies = computed(() => [...props.thread.replies.items.slice().reverse()])

const applicationIds = ref<string[]>([])

type Data = {
  applicationId?: string
}

const hostAppStore = useHostAppStore()
const accStore = useAccountStore()
const app = useNuxtApp()
const projectAccount = computed(() =>
  accStore.accountWithFallback(props.modelCard.accountId, props.modelCard.serverUrl)
)
const clientId = projectAccount.value.accountInfo.id

const selectedObjectIds = computed(() => {
  const viewerState = props.thread.viewerState
  if (!viewerState) {
    return []
  }
  return (viewerState as ViewerState).ui.filters.selectedObjectIds
})

const threadAuthors = computed(() => {
  const authors = [props.thread.author]
  for (const reply of props.thread.replies.items) {
    if (!authors.find((u) => u.id === reply.author.id)) authors.push(reply.author)
  }
  return authors
})

// Make TS happy -> server returns viewer state as JSONObject
type ViewerState = {
  ui: {
    filters: {
      selectedObjectIds: string[]
    }
  }
}

// Loop over each objectId to run the query and collect application IDs
selectedObjectIds.value.forEach((objectId) => {
  const { result: objectResult } = useQuery(
    objectQuery,
    () => ({
      projectId: props.modelCard.projectId,
      objectId
    }),
    () => ({ clientId })
  )

  watch(objectResult, (newValue) => {
    const data = newValue?.project.object?.data as Data | undefined
    const applicationId = data?.applicationId
    if (applicationId && !applicationIds.value.includes(applicationId)) {
      applicationIds.value.push(applicationId)
    }
  })
})

const highlightObjects = async () => {
  if (isSender.value) {
    // NOTE: sent objects has same hack with automate, unfortunately we call server again to get applicationId on sent objects
    await app.$baseBinding.highlightObjects(applicationIds.value)
  } else {
    // NOTE: received objects generates different application ids
    // thats why we need mapped bakedObjectIds on HostObjectBuilders
    const receiver = hostAppStore.models.find(
      (m) => m.modelId === props.modelCard.modelId
    ) as unknown as IReceiverModelCard
    if (receiver.bakedObjectIds) {
      const bakedObjectIds = receiver.bakedObjectIds
      const receivedApplicationIds = selectedObjectIds.value
        .map((id) => bakedObjectIds[id])
        .filter((id): id is string => id !== undefined)

      await app.$baseBinding.highlightObjects(receivedApplicationIds)
    }
  }
}

const expanded = ref(false)
</script>
