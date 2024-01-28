<template>
  <ProjectPageStatsBlock>
    <template #top>
      <div class="flex items-center">
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-0.5 flex-grow select-none">
            <Cog6ToothIcon class="h-5 w-5" />
            <span class="text-sm">Settings</span>
          </div>
          <div class="flex items-center text-xs">
            {{ project.role?.split(':').reverse()[0] }}
          </div>
        </div>
      </div>
    </template>
    <template #bottom>
      <div class="flex items-center justify-between mt-3">
        <UserAvatarGroup :users="teamUsers" class="max-w-[104px]" />
        <div>
          <FormButton class="ml-2" @click="dialogOpen = true">
            {{ project.role === 'stream:owner' ? 'Manage' : 'View' }}
          </FormButton>
        </div>
      </div>
    </template>
    <template #default>
      <ProjectPageTeamDialog
        v-model:open="dialogOpen"
        :project="project"
        :open-section="openSection"
      />
    </template>
  </ProjectPageStatsBlock>
</template>
<script setup lang="ts">
import { Cog6ToothIcon } from '@heroicons/vue/24/outline'
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectPageStatsBlockTeamFragment } from '~~/lib/common/generated/gql/graphql'

type OpenSectionType = 'invite' | 'access' | null

graphql(`
  fragment ProjectPageStatsBlockTeam on Project {
    id
    role
    team {
      role
      user {
        ...LimitedUserAvatar
      }
    }
    ...ProjectPageTeamDialog
  }
`)

const props = defineProps<{
  project: ProjectPageStatsBlockTeamFragment
}>()

const dialogOpen = ref(false)
const openSection = ref<OpenSectionType>(null)

const route = useRoute()

watch(
  () => route.query.settings,
  (newSettings) => {
    if (newSettings === 'true') {
      dialogOpen.value = true
    } else if (newSettings === 'invite') {
      dialogOpen.value = true
      openSection.value = 'invite'
    } else if (newSettings === 'access') {
      dialogOpen.value = true
      openSection.value = 'access'
    } else {
      dialogOpen.value = false
      openSection.value = null
    }
  },
  { immediate: true }
)

const teamUsers = computed(() => props.project.team.map((t) => t.user))
</script>
