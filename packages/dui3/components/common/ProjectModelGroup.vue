<template>
  <Suspense>
    <div class="space-y-2 mx-1">
      <div class="text-foreground-2 flex items-center justify-between">
        <button
          class="flex items-center transition hover:text-primary"
          @click="showModels = !showModels"
        >
          <ChevronDownIcon
            :class="`w-4 ${showModels ? '' : '-rotate-90'} transition`"
          />
          <div>{{ projectDetails.name }}</div>
        </button>
        <div class="rounded-md bg-foundation px-2 flex items-center space-x-2">
          <span class="text-xs">
            {{ projectDetails.role?.split(':').reverse()[0] }}
          </span>
          <span class="text-xs">Project Members</span>
          <UserAvatar
            v-for="user in projectDetails.team"
            :key="user.user.id"
            size="xs"
            :user="user.user"
          />
        </div>
      </div>
      <div v-show="showModels" class="ml-0 space-y-2">
        <template v-for="model in project.models">
          <CommonModelSender
            v-if="model.type === 'sender'"
            :key="model.modelId"
            :model="model"
            :project="project"
          />
        </template>
      </div>
    </div>
    <template #fallback>
      <div>Loading...</div>
    </template>
  </Suspense>
</template>
<script setup lang="ts">
import { ChevronDownIcon } from '@heroicons/vue/20/solid'
import { ProjectModelGroup } from '~~/store/documentState'
import { useGetProjectDetails } from '~~/lib/graphql/composables'

const props = defineProps<{
  project: ProjectModelGroup
}>()

const getProjectDetails = useGetProjectDetails(props.project.accountId)

const projectDetails = await getProjectDetails({ projectId: props.project.projectId })

const showModels = ref(true)
</script>
