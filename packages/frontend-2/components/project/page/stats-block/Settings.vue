<template>
  <div class="rounded-md shadow border-2 border-transparent p-3">
    <div class="flex items-center">
      <div class="flex items-end justify-between w-full text-foreground-2">
        <div v-if="activeUser" class="flex items-center gap-1 flex-grow select-none">
          <Cog6ToothIcon class="h-4 w-4" />
          <span class="text-sm font-bold">Settings</span>
        </div>
        <div v-else class="flex items-center gap-1 flex-grow select-none">
          <UsersIcon class="h-4 w-4" />
          <span class="text-sm font-bold">Team</span>
        </div>
        <div class="text-xs">
          {{ project.role?.split(':').reverse()[0] }}
        </div>
      </div>
    </div>
    <div class="flex items-center gap-4 justify-between mt-2">
      <UserAvatarGroup :users="teamUsers" class="max-w-[130px]" />
      <div v-if="activeUser">
        <FormButton size="sm" @click="onButtonClick">
          {{ project.role === 'stream:owner' ? 'Manage' : 'View' }}
        </FormButton>
      </div>
    </div>
    <ProjectPageTeamDialog
      v-model:open="dialogOpen"
      :project="project"
      :open-section="openSection"
    />
  </div>
</template>
<script setup lang="ts">
import { Cog6ToothIcon, UsersIcon } from '@heroicons/vue/24/outline'
import type { Optional } from '@speckle/shared'
import { OpenSectionType } from '~/lib/projects/helpers/components'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectPageStatsBlockTeamFragment } from '~~/lib/common/generated/gql/graphql'
const { activeUser } = useActiveUser()

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
const openSection = ref<OpenSectionType | undefined>()

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

watch(
  () => route.query.settings,
  (newSettings, oldSettings) => {
    if (newSettings !== oldSettings) {
      readDialogStateFromQuery()
    }
  },
  { immediate: true }
)
</script>
