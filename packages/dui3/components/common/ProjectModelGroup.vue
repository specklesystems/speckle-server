<template>
  <Suspense>
    <div class="space-y-2 mx-1">
      <div class="text-foreground-2 flex items-center justify-between">
        <button
          class="flex items-center transition hover:text-primary"
          @click="showModels = !showModels"
        >
          <ChevronDownIcon
            :class="`w-4 ${showModels ? '' : '-rotate-90'} transition mt-1`"
          />
          <div>{{ projectDetails.name }}</div>
        </button>

        <div
          class="rounded-md bg-foundation px-2 flex items-center space-x-2 justify-end"
        >
          <span class="text-xs">
            {{ projectDetails.role?.split(':').reverse()[0] }}
          </span>
          <!-- <span class="text-xs"></span> -->
          <UserAvatar
            v-for="user in projectDetails.team"
            :key="user.user.id"
            size="xs"
            :user="user.user"
          />
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
            <CommonModelSenderV2 :model="model" :project="project" />
          </CommonModelCard>
        </template>
        <template v-for="model in project.receivers" :key="model.modelId">
          <!-- TODO: Wrap it with CommonModelCard-->
          <CommonModelReceiver :model="model" :project="project" />
        </template>
        <div>
          <button
            class="flex w-full text-xs text-center justify-center bg-primary-muted hover:bg-primary hover:text-foreground-on-primary transition rounded-md py-2"
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
