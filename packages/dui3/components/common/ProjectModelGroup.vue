<template>
  <Suspense>
    <div class="space-y-2 border">
      <div class="text-foreground-2 flex items-center justify-between">
        <button
          class="flex items-center transition hover:text-primary"
          @click="showModels = !showModels"
        >
          <ChevronDownIcon
            :class="`w-4 ${showModels ? '' : '-rotate-90'} transition mt-1`"
          />
          <div class="font-bold">{{ projectDetails.name }}</div>
        </button>

        <div class="rounded-md px-2 flex items-center space-x-2 justify-end">
          <!-- <span class="text-xs">
            {{ projectDetails.role?.split(':').reverse()[0] }}
          </span> -->
          <!-- <span class="text-xs"></span> -->
          <div class="flex -space-x-2">
            <UserAvatar
              v-for="user in projectDetails.team"
              :key="user.user.id"
              size="xs"
              :user="user.user"
            />
          </div>
          <div>
            <button>
              <ArrowTopRightOnSquareIcon class="w-3" @click="$openUrl(projectUrl)" />
            </button>
          </div>
        </div>
      </div>

      <div v-show="showModels" class="space-y-2">
        <template v-for="model in project.senders" :key="model.modelId">
          <CommonModelCard :model-card="model" :project="project">
            <CommonModelSender :model="model" :project="project" />
          </CommonModelCard>
        </template>
        <template v-for="model in project.receivers" :key="model.modelId">
          <CommonModelCard :model-card="model" :project="project">
            <CommonModelReceiver :model="model" :project="project" />
          </CommonModelCard>
        </template>
        <div>
          <button
            class="flex w-full text-xs text-center justify-center bg-primary-muted hover:bg-primary hover:text-foreground-on-primary transition rounded-md py-1"
          >
            Add
          </button>
        </div>
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
