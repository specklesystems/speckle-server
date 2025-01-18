<template>
  <div
    :class="`border border-blue-500/10 rounded-md space-y-2 overflow-hidden mb-2 ${
      expanded ? 'shadow' : ''
    }`"
  >
    <button
      class="flex space-x-1 items-center max-w-full w-full px-1 py-1 h-8 transition hover:bg-primary-muted"
      @click="highlightObjects"
    >
      <UserAvatarGroup :users="threadAuthors" />
      <span class="truncate text-xs sm:text-sm font-medium">
        {{ thread.rawText }}
      </span>
      <div class="h-full grow flex justify-end">
        <button
          class="hover:bg-primary-muted hover:text-primary flex h-full items-center justify-center rounded"
          @click.stop="expanded = !expanded"
        >
          <ChevronDownIcon
            :class="`h-3 w-3 transition ${!expanded ? '-rotate-90' : 'rotate-0'}`"
          />
        </button>
      </div>
    </button>
    <div v-if="expanded" class="px-2 pb-2 space-y-4">
      {{ selectedObjectIds }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommentThreadsItemFragment } from '~/lib/common/generated/gql/graphql'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { objectQuery } from '~/lib/graphql/mutationsAndQueries'
import { useQuery } from '@vue/apollo-composable'
import { useAccountStore } from '~/store/accounts'
import type { IModelCard } from '~/lib/models/card'
import { useHostAppStore } from '~/store/hostApp'
import type { IReceiverModelCard } from '~/lib/models/card/receiver'

const props = defineProps<{
  modelCard: IModelCard
  thread: CommentThreadsItemFragment
}>()

const isSender = computed(() => {
  return props.modelCard.typeDiscriminator.includes('SenderModelCard')
})

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
    await app.$baseBinding.highlightObjects(applicationIds.value)
  } else {
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
