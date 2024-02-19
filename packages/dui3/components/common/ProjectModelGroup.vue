<template>
  <div
    v-if="projectDetails"
    class="p-2 bg-foundation dark:bg-neutral-700/10 rounded-md shadow"
  >
    <div
      class="text-foreground-2 flex items-center justify-between hover:bg-blue-500/10 rounded-md transition"
    >
      <button
        class="flex items-center transition hover:text-primary h-10 min-w-0"
        @click="showModels = !showModels"
      >
        <ChevronDownIcon
          :class="`w-5 ${showModels ? '' : '-rotate-90'} transition mt-1`"
        />
        <div class="font-bold text-left truncate">{{ projectDetails.name }}</div>
      </button>

      <div class="rounded-md px-2 flex items-center space-x-2 justify-end">
        <button v-tippy="'Open project in browser'">
          <ArrowTopRightOnSquareIcon class="w-4" @click="$openUrl(projectUrl)" />
        </button>
      </div>
    </div>

    <div v-show="showModels" class="space-y-4 mt-3 pb-2">
      <!-- <div v-if="project.senders.length > 0" class="caption text-foreground-2">
        Published models
      </div> -->
      <ModelSender
        v-for="model in project.senders"
        :key="model.modelCardId"
        :model-card="model"
        :project="project"
      />
      <!-- <div v-if="project.receivers.length > 0" class="caption text-foreground-2">
        Loaded models
      </div> -->
      <ModelReceiver
        v-for="model in project.receivers"
        :key="model.modelCardId"
        :model-card="model"
        :project="project"
      />

      <template v-for="model in project.receivers" :key="model.modelId">
        <!-- <CommonModelCard :model-card="model" :project="project">
            <CommonModelReceiver :model="model" :project="project" />
          </CommonModelCard> -->
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery, useSubscription } from '@vue/apollo-composable'
import { ChevronDownIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/20/solid'
import { ProjectModelGroup, useHostAppStore } from '~~/store/hostApp'
import { useAccountStore } from '~~/store/accounts'
import {
  projectDetailsQuery,
  versionCreatedSubscription
} from '~~/lib/graphql/mutationsAndQueries'
const accountStore = useAccountStore()
const hostAppStore = useHostAppStore()
const { $openUrl } = useNuxtApp()

const props = defineProps<{
  project: ProjectModelGroup
}>()

const { result: projectDetailsResult } = useQuery(
  projectDetailsQuery,
  () => ({ projectId: props.project.projectId }),
  () => ({ clientId: props.project.accountId })
)

const projectDetails = computed(() => projectDetailsResult.value?.project)

const showModels = ref(true)

const projectUrl = computed(() => {
  const acc = accountStore.accounts.find(
    (acc) => acc.accountInfo.id === props.project.accountId
  )
  return `${acc?.accountInfo.serverInfo.url as string}/projects/${
    props.project.projectId
  }`
})

const { onResult } = useSubscription(
  versionCreatedSubscription,
  () => ({ projectId: props.project.projectId }),
  () => ({ clientId: props.project.accountId })
)

onResult((res) => {
  if (!res.data) return
  if (res.data?.projectVersionsUpdated?.type !== 'CREATED') return

  const relevantReceiver = props.project.receivers.find(
    (r) => r.modelId === res.data?.projectVersionsUpdated.version?.model.id
  )
  if (!relevantReceiver) return

  hostAppStore.patchModel(relevantReceiver.modelCardId, {
    latestVersionId: res.data.projectVersionsUpdated.version?.id,
    hasDismissedUpdateWarning: false,
    receiveResult: { ...relevantReceiver.receiveResult, display: false }
  })

  // res.data.projectVersionsUpdated.version.
})
</script>
