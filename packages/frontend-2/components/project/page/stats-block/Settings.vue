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
          <FormButton class="ml-2" @click="onButtonClick">
            {{ project.role === 'stream:owner' ? 'Manage' : 'View' }}
          </FormButton>
        </div>
      </div>
    </template>
    <template #default>
      <ProjectPageTeamDialog
        v-model:open="dialogOpen"
        :project="project"
        :open-section="openSection || undefined"
      />
    </template>
  </ProjectPageStatsBlock>
</template>
<script setup lang="ts">
import { Cog6ToothIcon } from '@heroicons/vue/24/outline'
import type { Optional } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectPageStatsBlockTeamFragment } from '~~/lib/common/generated/gql/graphql'
import { OpenSectionType } from '~~/lib/projects/helpers/components'

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
const openSection = ref<OpenSectionType | null>(null)

const route = useRoute()
const router = useRouter()

const teamUsers = computed(() => props.project.team.map((t) => t.user))

const readDialogStateFromQuery = async () => {
  const newSettings = route.query.settings as Optional<string | true>
  let shouldShow = false

  if (!newSettings) {
    shouldShow = false
  } else if (newSettings === 'invite') {
    shouldShow = true
    openSection.value = OpenSectionType.Invite
  } else if (newSettings === 'access') {
    shouldShow = true
    openSection.value = OpenSectionType.Access
  } else {
    shouldShow = true
    openSection.value = OpenSectionType.Team
  }

  if (shouldShow) {
    dialogOpen.value = true
    await router.replace({ query: { ...route.query, settings: undefined } })
  }
}

const onButtonClick = () => {
  openSection.value = OpenSectionType.Team
  dialogOpen.value = true
}

onMounted(() => {
  readDialogStateFromQuery()
})
</script>
