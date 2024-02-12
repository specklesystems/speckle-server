<template>
  <Suspense>
    <div class="p-2 my-2 bg-foundation dark:bg-neutral-700/10 rounded-md shadow">
      <div class="text-foreground-2 flex items-center justify-between">
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

      <div v-show="showModels" class="space-y-4 mt-3">
        <ModelSender
          v-for="model in project.senders"
          :key="model.modelId"
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
    <template #fallback>
      <div>Loading/Error...</div>
    </template>
  </Suspense>
</template>
<script setup lang="ts">
import { ChevronDownIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/20/solid'
import { ProjectModelGroup } from '~~/store/hostApp'
import { useAccountStore } from '~~/store/accounts'
import { useGetProjectDetails } from '~~/lib/graphql/composables'
const accountStore = useAccountStore()
const { $openUrl } = useNuxtApp()

const props = defineProps<{
  project: ProjectModelGroup
}>()

const getProjectDetails = useGetProjectDetails(props.project.accountId)

const projectDetails = await getProjectDetails({ projectId: props.project.projectId })

const showModels = ref(true)

const projectUrl = computed(() => {
  const acc = accountStore.accounts.find(
    (acc) => acc.accountInfo.id === props.project.accountId
  )
  return `${acc?.accountInfo.serverInfo.url as string}/projects/${
    props.project.projectId
  }`
})
</script>
