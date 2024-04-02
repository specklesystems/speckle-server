<template>
  <ProjectPageStatsBlock>
    <template #top>
      <div class="flex items-center">
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-1 flex-grow select-none">
            <UsersIcon class="h-5 w-5" />
            <span class="text-sm font-bold">Team</span>
          </div>
          <div class="flex items-center text-sm">
            {{ project.role?.split(':').reverse()[0] }}
          </div>
        </div>
      </div>
    </template>
    <template #bottom>
      <div class="flex items-center justify-between mt-1">
        <UserAvatarGroup :users="teamUsers" class="max-w-[104px]" />
        <div v-if="activeUser">
          <FormButton class="ml-2" :icon-left="UserPlusIcon" @click="onButtonClick">
            Invite
          </FormButton>
        </div>
      </div>
    </template>
    <template #default>
      <ProjectPageInviteDialog v-model:open="dialogOpen" />
    </template>
  </ProjectPageStatsBlock>
</template>
<script setup lang="ts">
import { UsersIcon, UserPlusIcon } from '@heroicons/vue/24/outline'
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
